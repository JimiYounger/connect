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
  
  constructor(config: TwilioConfig) {
    this.config = config;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  }
  
  /**
   * Sends an SMS message via Twilio API
   */
  async sendSms(request: SendSmsRequest): Promise<TwilioMessageResponse> {
    try {
      // Validate phone number format
      const formattedTo = this.formatPhoneNumber(request.to);
      
      // Check message length
      const segmentInfo = calculateMessageSegments(request.body);
      if (segmentInfo.isOverLimit) {
        throw new Error(`Message exceeds maximum length of 1600 characters (${segmentInfo.characterCount} provided)`);
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
      
      // Parse response
      const data = await response.json() as TwilioApiResponse;
      
      if (!response.ok) {
        return {
          sid: data.sid || '',
          status: 'failed',
          error: {
            code: data.errorCode || response.status.toString(),
            message: data.errorMessage || 'Unknown error occurred'
          }
        };
      }
      
      return {
        sid: data.sid,
        status: data.status
      };
    } catch (error) {
      console.error('Error sending SMS via Twilio:', error);
      return {
        sid: '',
        status: 'failed',
        error: {
          code: 'TWILIO_REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
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
  static createFromEnvironment(): TwilioService {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Missing required Twilio environment variables');
    }
    
    return new TwilioService({
      accountSid,
      authToken,
      phoneNumber
    });
  }
}

// Export a singleton instance for use throughout the application
export const twilioService = (() => {
  // Only create the service on the server side
  if (typeof window === 'undefined') {
    try {
      return TwilioService.createFromEnvironment();
    } catch (error) {
      console.error('Failed to initialize Twilio service:', error);
      // Return null in case of initialization failure
      return null;
    }
  }
  return null;
})(); 