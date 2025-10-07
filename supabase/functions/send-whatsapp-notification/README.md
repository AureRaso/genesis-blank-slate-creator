# Send WhatsApp Notification Edge Function

This Supabase Edge Function sends WhatsApp messages via Whapi.cloud API.

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Link to your Supabase project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Set Environment Variables

You need to set the following secrets in your Supabase project:

```bash
# Set Whapi.cloud token
supabase secrets set WHAPI_TOKEN=your_whapi_token_here

# Optional: Set custom Whapi endpoint (default is https://gate.whapi.cloud)
supabase secrets set WHAPI_ENDPOINT=https://gate.whapi.cloud
```

To get your Whapi token:
1. Go to https://whapi.cloud
2. Create an account
3. Create a new channel
4. Copy the API token

### 4. Deploy the Function

```bash
supabase functions deploy send-whatsapp-notification
```

## Testing

You can test the function locally:

```bash
supabase functions serve send-whatsapp-notification
```

Then make a request:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-whatsapp-notification' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"groupChatId":"1234567890@g.us","message":"Test message"}'
```

## Usage from Frontend

```typescript
import { useSendWhatsAppNotification } from '@/hooks/useWhatsAppNotification';

const { mutate: sendWhatsApp } = useSendWhatsAppNotification();

sendWhatsApp({
  groupChatId: '1234567890@g.us',
  className: 'Advanced Tennis',
  classDate: '2025-10-07',
  classTime: '15:00',
  trainerName: 'John Doe',
  waitlistUrl: 'https://yourapp.com/waitlist/abc123/2025-10-07',
  availableSlots: 1
});
```

## Whapi.cloud Group Chat ID Format

- For groups: `1234567890@g.us`
- For individuals: `1234567890@s.whatsapp.net`

You can get the group chat ID by:
1. Using Whapi.cloud dashboard
2. Calling the `/groups` endpoint
3. Sending a test message and checking the response
