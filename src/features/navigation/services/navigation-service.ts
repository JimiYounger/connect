// my-app/src/features/navigation/services/navigation-service.ts

import { createClient } from '@/lib/supabase'
import type {
  NavigationMenuRow,
  NavigationMenuInsert,
  NavigationMenuUpdate,
  NavigationItemRow,
  NavigationItemInsert,
  NavigationItemUpdate,
  NavigationItemRoleInsert,
  NavigationItemWithChildren,
  NavigationMenuWithItems,
  NavigationRoleAssignments,
  RoleType
} from '../types'

/**
 * Get all navigation menus with item counts
 */
// In your getNavigationMenus function in navigation-service.ts

export async function getNavigationMenus(): Promise<NavigationMenuRow[]> {
    try {
      // Use API endpoint instead of direct Supabase query
      const response = await fetch('/api/navigation/menus')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch navigation menus: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching navigation menus:', error)
      throw error
    }
  }

/**
 * Get a specific navigation menu by ID, including its items
 */
export async function getNavigationMenuById(id: string): Promise<NavigationMenuWithItems | null> {
  const supabase = createClient()
  
  // Get menu with item count
  const { data: menu, error: menuError } = await supabase
    .from('navigation_menus')
    .select(`
      *,
      items:navigation_items(count)
    `)
    .eq('id', id)
    .single()
  
  if (menuError) throw menuError
  if (!menu) return null

  // Get items with their roles
  const { data: items, error: itemsError } = await supabase
    .from('navigation_items')
    .select(`
      *,
      roles:navigation_item_roles(*)
    `)
    .eq('menu_id', id)
    .order('order_index')

  if (itemsError) throw itemsError

  // Convert flat items array to nested structure
  const nestedItems = buildNavigationTree(items)
  
  return {
    ...menu,
    items_count: menu.items?.[0]?.count ?? 0,
    items: nestedItems
  }
}

/**
 * Create a new navigation menu
 */
export async function createNavigationMenu(data: NavigationMenuInsert): Promise<NavigationMenuRow> {
  const supabase = createClient()
  
  // Ensure we have an authenticated session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.error('Session error:', sessionError)
    throw new Error('Authentication error')
  }
  
  if (!sessionData.session) {
    console.error('No session found')
    throw new Error('Authentication required')
  }

  // Get the user's profile to verify admin status and get profile ID
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, role_type')
    .eq('user_id', sessionData.session.user.id)
    .single()

  if (profileError) {
    console.error('Profile error:', profileError)
    throw new Error('Failed to verify permissions')
  }

  if (profileData?.role_type !== 'Admin') {
    console.error('User is not an admin:', profileData?.role_type)
    throw new Error('Admin privileges required')
  }

  // Attempt to create the menu using the profile ID
  const { data: newMenu, error: createError } = await supabase
    .from('navigation_menus')
    .insert({
      ...data,
      created_by: profileData.id  // Use profile ID instead of auth user ID
    })
    .select(`
      *,
      items:navigation_items(count)
    `)
    .single()
  
  if (createError) {
    console.error('Create menu error:', createError)
    throw createError
  }
  
  return {
    ...newMenu,
    items_count: 0
  }
}

/**
 * Update an existing navigation menu
 */
export async function updateNavigationMenu(id: string, data: NavigationMenuUpdate): Promise<NavigationMenuRow> {
  const supabase = createClient()
  
  const { data: updatedMenu, error } = await supabase
    .from('navigation_menus')
    .update(data)
    .eq('id', id)
    .select(`
      *,
      items:navigation_items(count)
    `)
    .single()
  
  if (error) throw error

  return {
    ...updatedMenu,
    items_count: updatedMenu.items?.[0]?.count ?? 0
  }
}

/**
 * Delete a navigation menu
 */
export async function deleteNavigationMenu(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('navigation_menus')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

/**
 * Get navigation items, optionally filtered by menu ID
 */
export async function getNavigationItems(menuId?: string): Promise<NavigationItemWithChildren[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('navigation_items')
    .select(`
      *,
      roles:navigation_item_roles(*)
    `)
    .order('order_index')

  if (menuId) {
    query = query.eq('menu_id', menuId)
  }

  const { data, error } = await query
  
  if (error) throw error
  return buildNavigationTree(data)
}

/**
 * Get a specific navigation item by ID, including its roles
 */
export async function getNavigationItem(id: string): Promise<NavigationItemWithChildren | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('navigation_items')
    .select(`
      *,
      roles:navigation_item_roles!inner(
        id,
        navigation_item_id,
        role_type,
        team,
        area,
        region,
        created_at
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  if (!data) return null
  
  // Cast the roles to ensure proper typing
  const typedData: NavigationItemWithChildren = {
    ...data,
    children: [],
    roles: data.roles.map(role => ({
      ...role,
      role_type: role.role_type as RoleType | 'Any'
    }))
  }
  
  return typedData
}

/**
 * Create a new navigation item
 */
export async function createNavigationItem(data: NavigationItemInsert): Promise<NavigationItemRow> {
  const supabase = createClient()
  
  console.log('Creating navigation item with data:', data)
  
  // Process data to ensure URL is always a string (not null)
  const { is_folder, ...dataToProcess } = data;
  
  // Create a copy with guaranteed string URL
  const dataToInsert = {
    ...dataToProcess,
    // For folders without a URL or empty URL, use # as placeholder
    url: (is_folder && (!dataToProcess.url || dataToProcess.url.trim() === '')) 
      ? '#' 
      : (dataToProcess.url || '') // Ensure a string value for non-folders too
  };
  
  try {
    // Just select the fields we know exist in the navigation_items table
    const { data: newItem, error } = await supabase
      .from('navigation_items')
      .insert(dataToInsert)
      .select(`
        id,
        menu_id,
        parent_id,
        title,
        url,
        description,
        dynamic_variables,
        is_external,
        open_in_iframe,
        order_index,
        is_active,
        is_public,
        start_date,
        end_date,
        created_at,
        updated_at,
        created_by
      `)
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Successfully created navigation item:', newItem)
    return newItem
  } catch (error) {
    console.error('Failed to create navigation item:', error)
    throw error
  }
}

/**
 * Update an existing navigation item
 */
export async function updateNavigationItem(id: string, data: NavigationItemUpdate): Promise<NavigationItemRow> {
  const supabase = createClient()
  
  // Process data to ensure URL is always a string (not null) if present in the update
  const { is_folder, ...dataToProcess } = data as NavigationItemUpdate & { is_folder?: boolean };
  
  // Create a copy with guaranteed string URL if URL is being updated
  const dataToUpdate = {
    ...dataToProcess,
    // Only modify URL if it's included in the update
    ...(dataToProcess.url !== undefined ? {
      // For folders without a URL or empty URL, use # as placeholder
      url: (is_folder && (!dataToProcess.url || dataToProcess.url === '')) 
        ? '#' 
        : (dataToProcess.url || '') // Ensure a string value for non-folders too
    } : {})
  };
  
  const { data: updatedItem, error } = await supabase
    .from('navigation_items')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return updatedItem
}

/**
 * Delete a navigation item
 */
export async function deleteNavigationItem(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('navigation_items')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

/**
 * Assign a role to a navigation item
 */
export async function assignRoleToItem(itemId: string, roleData: NavigationItemRoleInsert) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('navigation_item_roles')
    .insert({
      ...roleData,
      navigation_item_id: itemId
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Remove a role assignment from a navigation item
 */
export async function removeRoleFromItem(roleId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('navigation_item_roles')
    .delete()
    .eq('id', roleId)
  
  if (error) throw error
}

/**
 * Get navigation items for a specific user based on their role and attributes
 */
export async function getUserNavigation(
  userId: string,
  roleType: string,
  team?: string,
  area?: string,
  region?: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_navigation_for_user', {
      p_user_id: userId,
      p_role_type: roleType,
      p_team: team,
      p_area: area,
      p_region: region
    })
  
  if (error) throw error
  // Ensure data is an array before passing to buildNavigationTree
  return buildNavigationTree(Array.isArray(data) ? data : [])
}

/**
 * Delete all roles for a navigation item
 */
export async function deleteRolesByItemId(itemId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('navigation_item_roles')
      .delete()
      .eq('navigation_item_id', itemId);
    
    if (error) throw error;
  }

/**
 * Helper function to build a nested navigation tree from flat data
 */
function buildNavigationTree(items: any[]): NavigationItemWithChildren[] {
  const itemMap = new Map()
  const roots: NavigationItemWithChildren[] = []

  // First pass: create map of items
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  // Second pass: build tree structure
  items.forEach(item => {
    const node = itemMap.get(item.id)
    if (item.parent_id) {
      const parent = itemMap.get(item.parent_id)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

/**
 * Create multiple role assignments for a navigation item
 */
export async function assignRolesToItem(
  itemId: string, 
  assignments: NavigationRoleAssignments
): Promise<void> {
  const supabase = createClient();
  const roleAssignments: NavigationItemRoleInsert[] = [];
  
  // Process role types
  assignments.roleTypes.forEach(roleType => {
    roleAssignments.push({
      navigation_item_id: itemId,
      role_type: roleType,
      team: null,
      area: null,
      region: null
    });
  });
  
  // Process teams
  assignments.teams.forEach(team => {
    roleAssignments.push({
      navigation_item_id: itemId,
      role_type: 'Any', // Default role type for non-role assignments
      team,
      area: null,
      region: null
    });
  });
  
  // Process areas
  assignments.areas.forEach(area => {
    roleAssignments.push({
      navigation_item_id: itemId,
      role_type: 'Any',
      team: null,
      area,
      region: null
    });
  });
  
  // Process regions
  assignments.regions.forEach(region => {
    roleAssignments.push({
      navigation_item_id: itemId,
      role_type: 'Any',
      team: null,
      area: null,
      region
    });
  });
  
  // Delete existing assignments first
  await deleteRolesByItemId(itemId);
  
  // Insert new assignments if we have any
  if (roleAssignments.length > 0) {
    const { error } = await supabase
      .from('navigation_item_roles')
      .insert(roleAssignments);
    
    if (error) throw error;
  }
} 