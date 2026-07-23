import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  subject: z.string().min(3),
  message: z.string().min(10)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Create support ticket
    const ticket = await db.supportTicket.create({
      data: {
        userId: 'guest',
        subject: data.subject,
        description: data.message,
        status: 'open',
        priority: 'medium'
      }
    });

    // Create ticket message with contact info
    await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: 'guest',
        message: `نام: ${data.name}\nتلفن: ${data.phone}\nایمیل: ${data.email || 'ندارد'}\n\n${data.message}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.',
      ticketId: ticket.id
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'لطفاً تمام فیلدها را به درستی پر کنید' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ارسال پیام' }, { status: 500 });
  }
}
