// my-app/src/features/widgets/components/admin/form-fields/redirect-widget-fields.tsx

import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DynamicUrlBuilder } from './dynamic-url-builder';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { APP_PRESETS, AppPreset } from '../../../utils/deep-link';

// Defensive input that handles undefined values
const SafeInput = ({ value, onChange, ...props }: any) => (
  <Input 
    value={value || ''} 
    onChange={onChange}
    {...props} 
  />
);

export function RedirectWidgetFields() {
  const { control, setValue, watch, getValues } = useFormContext();
  
  // Initialize deep link configuration
  useEffect(() => {
    // Pre-initialize all deep link fields to prevent controlled/uncontrolled issues
    if (!getValues('config.deepLink')) {
      setValue('config.deepLink', {
        enabled: false,
        iosScheme: '',
        androidPackage: '',
        webFallbackUrl: getValues('config.redirectUrl') || ''
      });
    }
  }, [setValue, getValues]);
  
  // Use the state to track enabled status separately from form value
  const [deepLinkEnabled, setDeepLinkEnabled] = useState(false);
  
  // Sync our state with form value when it changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'config.deepLink.enabled') {
        setDeepLinkEnabled(!!value.config?.deepLink?.enabled);
      }
    });
    
    // Initialize from current value
    setDeepLinkEnabled(!!getValues('config.deepLink.enabled'));
    
    return () => subscription.unsubscribe();
  }, [watch, getValues]);
  
  // Handle app preset selection
  const handlePresetChange = (preset: AppPreset) => {
    const presetData = APP_PRESETS[preset];
    setValue('config.deepLink.iosScheme', presetData.iosScheme);
    setValue('config.deepLink.androidPackage', presetData.androidPackage);
  };

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="config.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display Title</FormLabel>
            <FormControl>
              <SafeInput 
                placeholder="Widget title (shown to users)" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The title displayed to users (can be different from widget name)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subtitle (optional)</FormLabel>
            <FormControl>
              <SafeInput 
                placeholder="Brief subtitle or tagline" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              A short subtitle displayed under the title
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="More detailed description" 
                {...field} 
                value={field.value || ''}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              Additional text to help users understand this link
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.redirectUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dynamic Redirect URL</FormLabel>
            <FormControl>
              <DynamicUrlBuilder
                value={field.value || ''}
                onChange={(value) => {
                  field.onChange(value);
                  setValue('config.redirectUrl', value);
                  // Also update web fallback URL when redirect URL changes
                  if (!getValues('config.deepLink.webFallbackUrl')) {
                    setValue('config.deepLink.webFallbackUrl', value);
                  }
                }}
              />
            </FormControl>
            <FormDescription>
              The URL where users will be redirected. You can insert dynamic user fields that will be replaced with each user&apos;s data.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Deep Linking Section */}
      <div className="border rounded-lg p-4 space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium">Mobile Deep Linking</h3>
            <p className="text-sm text-muted-foreground">
              Open specific mobile apps when users click this widget on a mobile device
            </p>
          </div>
          <FormField
            control={control}
            name="config.deepLink.enabled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setDeepLinkEnabled(checked);
                      
                      // Initialize web fallback URL if not set
                      if (checked && !getValues('config.deepLink.webFallbackUrl')) {
                        setValue('config.deepLink.webFallbackUrl', getValues('config.redirectUrl') || '');
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {deepLinkEnabled && (
          <div className="space-y-4">
            <FormField
              control={control}
              name="config.deepLink.preset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Common App Presets</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handlePresetChange(value as AppPreset);
                    }}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a common app..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(APP_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose from common apps or configure custom deep links below
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <FormField
              control={control}
              name="config.deepLink.iosScheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>iOS URL Scheme</FormLabel>
                  <FormControl>
                    <SafeInput 
                      placeholder="exampleapp://" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL scheme for iOS devices (e.g., &quot;salesforce://&quot;)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.deepLink.androidPackage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Android Package Name</FormLabel>
                  <FormControl>
                    <SafeInput 
                      placeholder="com.example.app" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Package name for Android devices (e.g., &quot;com.salesforce.chatter&quot;)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.deepLink.webFallbackUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Web Fallback URL</FormLabel>
                  <FormControl>
                    <SafeInput 
                      placeholder="https://example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL to open if the app is not installed (defaults to the main redirect URL)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4 border-t mt-4">
              <h4 className="text-sm font-medium mb-2">App Store IDs (Optional)</h4>
              <p className="text-sm text-muted-foreground mb-4">
                If provided, users without the app will be directed to the app store instead of the web fallback
              </p>
              
              <FormField
                control={control}
                name="config.deepLink.iosAppStoreId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>iOS App Store ID</FormLabel>
                    <FormControl>
                      <SafeInput 
                        placeholder="123456789" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The numeric App Store ID (e.g., &quot;389801252&quot; for Gmail)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="config.deepLink.androidAppStoreId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Android Package ID</FormLabel>
                    <FormControl>
                      <SafeInput 
                        placeholder="com.example.app" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The Android package ID for Google Play Store (usually same as package name)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-muted-foreground">
          Links will automatically open in a new tab and track clicks for analytics.
          {deepLinkEnabled && " On mobile devices, the app will be opened if installed."}
        </p>
      </div>
    </div>
  );
}
