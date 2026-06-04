import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

const SECRET_KEY = process.env.JWT_SECRET
type LoginRequest = {
    usercode?: string;
    password?: string;
    action?: 'login' | 'logout' | 'newid';
    newid_usercode?: string;
    newid_username?: string;
    newid_password?: string;
};

type UserRow = RowDataPacket & {
    usercode: string;
    username?: string;
};

export async function POST(req: NextRequest) {
        const body = (await req.json()) as LoginRequest;
        const { usercode, password, action } = body;

        if(action == 'login') {
            let conn;
            try {
                if (!SECRET_KEY) {
                    return NextResponse.json({ message: 'JWT secret is not configured.' }, { status: 500 });
                }

                if (!usercode || !password) {
                    return NextResponse.json({ message: '아이디와 비밀번호를 입력하세요.', token: '' }, { status: 400 });
                }

                conn = await db.getConnection();


                const [rows] = await conn.query(
                    'SELECT * FROM users WHERE usercode = ? AND password = ?',
                    [usercode, password]
                ) as [UserRow[], unknown]

                if(rows.length === 0) {
                    return NextResponse.json({message: '아이디 또는 비밀번호가 올바르지 않습니다.', token: ''}, {status: 401});
                } else {
                    const payload = { usercode };
                    const token = jwt.sign(payload, SECRET_KEY!, { expiresIn: '5h' });

                    const response = NextResponse.json({ message : '로그인에 성공했습니다.', token: token });
                    response.cookies.set('token', token, {
                        httpOnly: true, 
                        secure: process.env.NODE_ENV === 'production', 
                        sameSite: 'lax', 
                        maxAge: 3600 * 5,
                        path: '/',
                    });
                    return response
                }
            } catch (err) {
                console.error(err);
                return NextResponse.json({ message: '로그인 처리 중 오류가 발생했습니다.', token: '' }, { status: 500 });
            } finally {
                if (conn) conn.release();
            }
        }

        if(action == 'logout') {
            const response = NextResponse.json({ message: 'Logout success' });
            response.cookies.set('token', '', {
                httpOnly: true,
                expires: new Date(0),
                path: '/',
            });
            return response;
        }     

        if(action == 'newid') {
            let conn;
            try {
                const {newid_usercode, newid_username, newid_password} = body;

                if (!newid_usercode || !newid_username || !newid_password) {
                    return NextResponse.json({ message: '필수 가입 정보를 입력하세요.' }, { status: 400 });
                }

                conn = await db.getConnection();
                const [exists] = await conn.query(
                    'SELECT usercode FROM users WHERE usercode = ? LIMIT 1',
                    [newid_usercode]
                ) as [UserRow[], unknown];

                if (exists.length > 0) {
                    return NextResponse.json({ message: '이미 사용 중인 아이디입니다.' }, { status: 409 });
                }

                await conn.query<ResultSetHeader>(
                    'INSERT INTO users (usercode, username, password) VALUES (?, ?, ?)',
                    [newid_usercode, newid_username, newid_password]
                );

                return NextResponse.json({ message: '회원가입이 완료되었습니다.' }, { status: 201 });
            } catch (err) {
                console.error(err);
                return NextResponse.json({ message: '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 });
            } finally {
                if (conn) conn.release();
            }
        }

        return NextResponse.json({ message: '지원하지 않는 요청입니다.' }, { status: 400 });
}
