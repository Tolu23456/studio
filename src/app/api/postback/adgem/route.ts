// /app/api/postback/adgem/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { rewardOfferwallCompletion } from '@/services/user-data';

// IMPORTANT: Replace this with your actual AdGem Secret Key from your dashboard.
// It is highly recommended to store this in an environment variable.
const ADGEM_SECRET_KEY = process.env.ADGEM_SECRET_KEY || 'YOUR_ADGEM_SECRET_KEY_HERE';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // 1. Parse all required and optional parameters from AdGem
  const user_id = searchParams.get('user_id'); // This is our adsenerId
  const reward_amount = searchParams.get('amount');
  const transaction_id = searchParams.get('transaction_id');
  const offer_id = searchParams.get('offer_id');
  const signature = searchParams.get('sig');
  const ip_address = req.headers.get('x-forwarded-for') || req.ip;

  // 2. Validate that all essential parameters are present
  if (!user_id || !reward_amount || !transaction_id || !signature) {
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  // 3. Authenticate the request by validating the signature
  const expectedSignature = crypto
    .createHash('md5')
    .update(`${user_id}:${reward_amount}:${ADGEM_SECRET_KEY}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  const amount = parseInt(reward_amount, 10);
  if (isNaN(amount)) {
      return new NextResponse('Invalid reward amount', { status: 400 });
  }
  
  // 4. Process the reward
  try {
    const result = await rewardOfferwallCompletion({
      adsenerId: user_id,
      rewardAmount: amount,
      transactionId: transaction_id,
      offerId: offer_id || 'N/A',
      network: 'AdGem',
      ip: ip_address || 'N/A'
    });

    if (result.success) {
      // AdGem expects a '1' for a successful callback
      return new NextResponse('1', { status: 200 });
    } else {
      // Handle specific errors from our service layer
      switch (result.error) {
        case 'user_not_found':
          return new NextResponse('User not found', { status: 404 });
        case 'duplicate_transaction':
           // Also return '1' for duplicate transactions as AdGem may retry.
          return new NextResponse('1', { status: 200 });
        default:
          return new NextResponse('Failed to process reward', { status: 500 });
      }
    }
  } catch (error) {
    console.error('Postback processing error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
