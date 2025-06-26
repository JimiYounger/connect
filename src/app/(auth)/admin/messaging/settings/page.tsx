'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useMessagingSettings } from '@/features/messaging/hooks/useMessagingSettings'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search } from 'lucide-react'

// Create simple chart components since shadcn doesn't have them
type ChartProps = {
  data: any[];
  height?: number;
  [key: string]: any;
};

// Use _data as parameter name but keep data in the type
const LineChart = ({ data: _data, _xAxis, _yAxis, height = 300 }: ChartProps & { _xAxis: string; _yAxis: string }) => (
  <div style={{ height }} className="flex items-center justify-center bg-muted/20 rounded-md">
    <p className="text-muted-foreground">Line Chart Placeholder</p>
  </div>
);

const BarChart = ({ data: _data, _xAxis, _yAxis, height = 300 }: ChartProps & { _xAxis: string; _yAxis: string }) => (
  <div style={{ height }} className="flex items-center justify-center bg-muted/20 rounded-md">
    <p className="text-muted-foreground">Bar Chart Placeholder</p>
  </div>
);

const PieChart = ({ data: _data, _category, _value, height = 300 }: ChartProps & { _category: string; _value: string }) => (
  <div style={{ height }} className="flex items-center justify-center bg-muted/20 rounded-md">
    <p className="text-muted-foreground">Pie Chart Placeholder</p>
  </div>
);

// Simple DataTable component
interface DataTableProps<TData> {
  columns: {
    accessorKey: string;
    header: string;
    cell?: (props: { row: { original: TData } }) => React.ReactNode;
  }[];
  data: TData[];
  searchKey: string;
}

function DataTable<TData extends Record<string, any>>({ 
  columns, 
  data, 
  searchKey 
}: DataTableProps<TData>) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = data.filter((item) => 
    String(item[searchKey] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex items-center border rounded-md px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder={`Search by ${searchKey}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey}>
                      {column.cell 
                        ? column.cell({ row: { original: row } })
                        : row[column.accessorKey]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function MessagingSettingsPage() {
  const { toast } = useToast();
  const { 
    settings, 
    updateSettings, 
    isLoading, 
    stats, 
    optOutUsers, 
    failedMessages,
    toggleUserOptOut
  } = useMessagingSettings();
  
  const [twilioAccountSid, setTwilioAccountSid] = useState(settings?.twilioAccountSid || '');
  const [twilioAuthToken, setTwilioAuthToken] = useState(settings?.twilioAuthToken || '');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(settings?.twilioPhoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        twilioAccountSid,
        twilioAuthToken,
        twilioPhoneNumber
      });
      toast({
        title: "Settings saved",
        description: "Your messaging settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  type OptOutUser = {
    id: string;
    name: string;
    email: string;
    phone: string;
    optedOut: boolean;
  };

  const optOutColumns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { 
      accessorKey: 'optedOut', 
      header: 'Opted Out',
      cell: ({ row }: { row: { original: OptOutUser } }) => (
        <Switch 
          checked={row.original.optedOut} 
          onCheckedChange={() => toggleUserOptOut({
            userId: row.original.id, 
            optedOut: !row.original.optedOut
          })}
        />
      )
    }
  ];

  type FailedMessage = {
    id: string;
    recipient: string;
    date: string;
    error: string;
    status: string;
  };

  const failedMessagesColumns = [
    { accessorKey: 'recipient', header: 'Recipient' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'error', header: 'Error' },
    { accessorKey: 'status', header: 'Status' },
    { 
      accessorKey: 'actions', 
      header: 'Actions',
      cell: ({ row }: { row: { original: FailedMessage } }) => (
        <Button size="sm" variant="outline" onClick={() => handleRetry(row.original.id)}>
          Retry
        </Button>
      )
    }
  ];

  const handleRetry = (_messageId: string) => {
    // Implementation for retrying failed messages
    toast({
      title: "Message queued",
      description: "The message has been queued for retry.",
    });
  };

  return (
    <AuthGuard>
      <div className="flex flex-col space-y-6">
        <h1 className="text-xl font-semibold">Messaging Settings</h1>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="optout">User Opt-Out</TabsTrigger>
            <TabsTrigger value="failed">Failed Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Twilio Configuration</CardTitle>
                <CardDescription>
                  Configure your Twilio account settings for SMS messaging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountSid">Account SID</Label>
                  <Input
                    id="accountSid"
                    value={twilioAccountSid}
                    onChange={(e) => setTwilioAccountSid(e.target.value)}
                    placeholder="Enter your Twilio Account SID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authToken">Auth Token</Label>
                  <Input
                    id="authToken"
                    type="password"
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                    placeholder="Enter your Twilio Auth Token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={twilioPhoneNumber}
                    onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                    placeholder="Enter your Twilio Phone Number"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Message Volume</CardTitle>
                  <CardDescription>
                    Total messages sent over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart 
                    data={stats?.messageVolume || []}
                    _xAxis="date"
                    _yAxis="count"
                    height={300}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Rate</CardTitle>
                  <CardDescription>
                    Message delivery success rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChart 
                    data={stats?.deliveryRate || []}
                    _category="status"
                    _value="count"
                    height={300}
                  />
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Messages by Department</CardTitle>
                  <CardDescription>
                    Distribution of messages across departments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart 
                    data={stats?.messagesByDepartment || []}
                    _xAxis="department"
                    _yAxis="count"
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="optout">
            <Card>
              <CardHeader>
                <CardTitle>User Opt-Out Management</CardTitle>
                <CardDescription>
                  Manage users who have opted out of receiving messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable<OptOutUser>
                  columns={optOutColumns}
                  data={optOutUsers || []}
                  searchKey="name"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="failed">
            <Card>
              <CardHeader>
                <CardTitle>Failed Messages</CardTitle>
                <CardDescription>
                  Review and retry messages that failed to send
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable<FailedMessage>
                  columns={failedMessagesColumns}
                  data={failedMessages || []}
                  searchKey="recipient"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
} 