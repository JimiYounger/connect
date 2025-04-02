import { 
  MessageSegmentInfo, 
  TwilioMessageResponse, 
  Recipient
} from '../types';

/**
 * Configuration interface for Twilio service
 */
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

/**
 * Request interface for sending SMS
 */
interface SendSmsRequest {
  to: string;
  body: string;
  from?: string;
  statusCallback?: string;
}

/**
 * Response interface from Twilio API
 */
interface TwilioApiResponse {
  sid: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  code?: number;
  message?: string;
  moreInfo?: string;
  detail?: string;
  rawResponse?: any;
}

/**
 * Calculates the number of SMS segments for a given message
 * Based on GSM-7 encoding (160 chars per segment) or UCS-2 (70 chars per segment)
 */
export const calculateMessageSegments = (content: string): MessageSegmentInfo => {
  // GSM-7 character set (basic Latin alphabet, numbers, and some special characters)
  // This is a simplified check - a full implementation would use a complete GSM-7 charset
  const gsm7Charset = /^[\x20-\x7E\n\r\t]*$/;
  const hasNonGsmChars = !gsm7Charset.test(content);
  
  // Characters per segment based on encoding
  const charsPerSegment = hasNonGsmChars ? 70 : 160;
  
  // For concatenated messages, headers take up space, reducing per-segment capacity
  const charsPerConcatenatedSegment = hasNonGsmChars ? 67 : 153;
  
  let segmentCount = 1;
  let remainingChars = 0;
  
  if (content.length <= charsPerSegment) {
    // Single segment message
    segmentCount = 1;
    remainingChars = charsPerSegment - content.length;
  } else {
    // Multi-segment message
    segmentCount = Math.ceil(content.length / charsPerConcatenatedSegment);
    const lastSegmentChars = content.length % charsPerConcatenatedSegment;
    remainingChars = lastSegmentChars === 0 
      ? 0 
      : charsPerConcatenatedSegment - lastSegmentChars;
  }
  
  return {
    content,
    segmentCount,
    characterCount: content.length,
    remainingCharacters: remainingChars,
    isOverLimit: content.length > 1600 // Twilio's hard limit is 1600 chars
  };
};

/**
 * Processes template variables in a message
 * Replaces {{variableName}} with actual values
 */
export const processTemplateVariables = (
  content: string, 
  recipient: Recipient, 
  customVariables?: Record<string, string>
): string => {
  let processedContent = content;
  
  // Replace standard recipient variables
  processedContent = processedContent
    .replace(/{{firstName}}/g, recipient.firstName || '')
    .replace(/{{lastName}}/g, recipient.lastName || '')
    .replace(/{{fullName}}/g, `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim())
    .replace(/{{email}}/g, recipient.email || '');
  
  // Replace organization-related variables
  if (recipient.roleType) {
    processedContent = processedContent.replace(/{{roleType}}/g, recipient.roleType);
  }
  if (recipient.team) {
    processedContent = processedContent.replace(/{{team}}/g, recipient.team);
  }
  if (recipient.area) {
    processedContent = processedContent.replace(/{{area}}/g, recipient.area);
  }
  if (recipient.region) {
    processedContent = processedContent.replace(/{{region}}/g, recipient.region);
  }
    
  // Replace custom variables if provided
  if (customVariables) {
    Object.entries(customVariables).forEach(([key, value]) => {
      processedContent = processedContent.replace(
        new RegExp(`{{${key}}}`, 'g'), 
        value || ''
      );
    });
  }
  
  // Clean up any remaining template variables that weren't replaced
  processedContent = processedContent.replace(/{{[^{}]+}}/g, '');
  
  return processedContent;
};

/**
 * TwilioService class for handling Twilio API interactions
 */
export class TwilioService {
  private config: TwilioConfig;
  private baseUrl: string;
  private debugMode: boolean;
  
  constructor(config: TwilioConfig, debugMode = false) {
    this.config = config;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    this.debugMode = debugMode;
  }
  
  /**
   * Sends an SMS message via Twilio API
   */
  async sendSms(request: SendSmsRequest): Promise<TwilioMessageResponse> {
    try {
      // Log request in debug mode
      if (this.debugMode) {
        console.log('[Twilio] Sending SMS request:', {
          to: request.to,
          from: request.from || this.config.phoneNumber,
          bodyLength: request.body.length,
          statusCallback: request.statusCallback,
          // Mask auth credentials for security
          accountSid: this.config.accountSid ? `${this.config.accountSid.substring(0, 4)}...` : undefined
        });
      }
      
      // Validate phone number format
      const formattedTo = this.formatPhoneNumber(request.to);
      
      // Log the formatted phone number
      if (this.debugMode) {
        console.log('[Twilio] Formatted phone number:', {
          original: request.to,
          formatted: formattedTo
        });
      }
      
      // Check message length
      const segmentInfo = calculateMessageSegments(request.body);
      if (segmentInfo.isOverLimit) {
        const error = `Message exceeds maximum length of 1600 characters (${segmentInfo.characterCount} provided)`;
        console.error('[Twilio] Message length error:', error);
        throw new Error(error);
      }
      
      // Prepare request body
      const formData = new URLSearchParams();
      formData.append('To', formattedTo);
      formData.append('From', request.from || this.config.phoneNumber);
      formData.append('Body', request.body);
      
      if (request.statusCallback) {
        formData.append('StatusCallback', request.statusCallback);
      }
      
      // Make API request to Twilio
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`
        },
        body: formData
      });
      
      // Get response text for detailed logging
      const responseText = await response.text();
      
      // Log raw response in debug mode
      if (this.debugMode) {
        console.log('[Twilio] Response status:', response.status);
        console.log('[Twilio] Response headers:', Object.fromEntries([...response.headers.entries()]));
        console.log('[Twilio] Response body:', responseText);
      }
      
      // Parse response
      let data: TwilioApiResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Twilio] Failed to parse JSON response:', parseError);
        console.error('[Twilio] Response text:', responseText);
        return {
          sid: '',
          status: 'failed',
          error: {
            code: 'INVALID_RESPONSE',
            message: `Failed to parse Twilio response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`
          }
        };
      }
      
      if (!response.ok) {
        const errorDetails = {
          statusCode: response.status,
          twilioErrorCode: data.errorCode || data.code?.toString(),
          twilioErrorMessage: data.errorMessage || data.message || data.detail,
          moreInfo: data.moreInfo,
          url: this.baseUrl,
          recipient: formattedTo,
          // Include full response in debug mode
          fullResponse: this.debugMode ? data : undefined
        };
        
        console.error('[Twilio] API error:', errorDetails);
        
        // Check for common errors and provide more helpful messages
        let errorMessage = data.errorMessage || data.message || 'Unknown Twilio API error';
        const errorCode = data.errorCode || data.code?.toString() || response.status.toString();
        
        if (errorCode === '21608') {
          errorMessage = 'The phone number is unverified. In trial mode, you can only send messages to verified numbers.';
        } else if (errorCode === '21610') {
          errorMessage = 'This Twilio account does not have permission to send messages to this region.';
        } else if (errorCode === '21611') {
          errorMessage = 'This phone number is not a valid mobile number.';
        } else if (errorCode === '20003') {
          errorMessage = 'Authentication error. Please check your Twilio account SID and auth token.';
        } else if (errorCode === '20404') {
          errorMessage = 'Resource not found. Check that your Twilio phone number is correct.';
        } else if (errorCode === '20429') {
          errorMessage = 'Too many requests to the Twilio API. Please try again later.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Check your Twilio credentials.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Your application is making too many requests to Twilio.';
        }
        
        return {
          sid: data.sid || '',
          status: 'failed',
          error: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails
          }
        };
      }
      
      if (this.debugMode) {
        console.log('[Twilio] Message sent successfully:', {
          sid: data.sid,
          status: data.status
        });
      }
      
      return {
        sid: data.sid,
        status: data.status
      };
    } catch (error) {
      // Create a detailed error object
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined,
        request: {
          to: request.to,
          from: request.from || this.config.phoneNumber,
          bodyLength: request.body.length,
          statusCallback: request.statusCallback
        }
      };
      
      console.error('[Twilio] Error sending SMS:', errorDetails);
      
      return {
        sid: '',
        status: 'failed',
        error: {
          code: 'TWILIO_REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: errorDetails
        }
      };
    }
  }
  
  /**
   * Validates and formats a phone number for Twilio
   * Ensures E.164 format (+1XXXXXXXXXX for US numbers)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Check if it's already in E.164 format (starts with +)
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // For US numbers (assuming 10 digits)
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    
    // For US numbers with country code
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
    
    // If we can't determine the format, return as is
    // In production, you might want to throw an error instead
    return phoneNumber;
  }
  
  /**
   * Creates a configured instance of TwilioService
   */
  static createFromEnvironment(debugMode = false): TwilioService {
    // Try both standard and Next.js server env var formats
    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.NEXT_TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.NEXT_TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_TWILIO_PHONE_NUMBER;
    
    // Log environment variables (masked) if in debug mode
    if (debugMode) {
      console.log('[Twilio] Environment variables:', {
        accountSid: accountSid ? `${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}` : undefined,
        authToken: authToken ? '********' : undefined,
        phoneNumber: phoneNumber,
        NODE_ENV: process.env.NODE_ENV,
        envKeys: Object.keys(process.env).filter(key => key.includes('TWILIO'))
      });
    }
    
    if (!accountSid || !authToken || !phoneNumber) {
      const missingVars = [];
      if (!accountSid) missingVars.push('TWILIO_ACCOUNT_SID');
      if (!authToken) missingVars.push('TWILIO_AUTH_TOKEN');
      if (!phoneNumber) missingVars.push('TWILIO_PHONE_NUMBER');
      
      const error = `Missing required Twilio environment variables: ${missingVars.join(', ')}`;
      console.error('[Twilio] Configuration error:', error);
      throw new Error(error);
    }
    
    return new TwilioService({
      accountSid,
      authToken,
      phoneNumber
    }, debugMode);
  }
  
  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[Twilio] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export a singleton instance for use throughout the application
let twilioServiceInstance: TwilioService | null = null;

// Ensure this code only runs on the server
if (typeof window === 'undefined') {
  // Create the service instance with error handling
  try {
    // Always enable debug mode
    twilioServiceInstance = TwilioService.createFromEnvironment(true); // Force debug mode on
  } catch (error) {
    console.error('[Twilio] Failed to initialize Twilio service:', error);
    // In development, provide a mock implementation so the app doesn't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Twilio] Using mock Twilio service in development mode');
      
      // Create a proper mock that matches the TwilioService type
      const mockService = new TwilioService({
        accountSid: 'MOCK_SID',
        authToken: 'MOCK_TOKEN',
        phoneNumber: 'MOCK_PHONE'
      }, true);
      
      // Override the sendSms method with a mock implementation
      mockService.sendSms = async (request) => {
        console.log('[Twilio][MOCK] Would send SMS:', request);
        return { 
          sid: 'MOCK_SID_' + Date.now(), 
          status: 'mock',
          error: {
            code: 'MOCK_SERVICE',
            message: 'This is a mock Twilio service for development. No real messages are sent.',
            details: { mock: true }
          }
        };
      };
      
      twilioServiceInstance = mockService;
    }
  }
} else {
  // Client-side, provide a stub that redirects to the API
  console.log('[Twilio] Creating stub Twilio service for client-side');
  
  // Create a stub service that delegates to the API
  const stubService = new TwilioService({
    accountSid: 'CLIENT_STUB',
    authToken: 'CLIENT_STUB',
    phoneNumber: 'CLIENT_STUB'
  }, false);
  
  // Override with a warning implementation for client-side
  stubService.sendSms = async () => {
    console.warn('[Twilio] Client-side SMS sending attempted. Use the messaging API instead.');
    return {
      sid: '',
      status: 'failed',
      error: {
        code: 'CLIENT_SIDE_CALL',
        message: 'SMS sending can only be done via server API routes. Use /api/messaging/send instead.',
        details: { clientSide: true }
      }
    };
  };
  
  twilioServiceInstance = stubService;
}

export const twilioService = twilioServiceInstance; 