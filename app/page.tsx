import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isValidToken } from '@/lib/auth';

export default async function Home() {
    const cookieStore = await cookies();
    const authenticated = isValidToken(cookieStore.get('token')?.value);

    redirect(authenticated ? '/dashboard' : '/login');
}
