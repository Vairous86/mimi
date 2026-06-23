import fs from 'fs';
import path from 'path';

// Define schemas
export interface User {
  username: string;
  passwordHash: string; // for mock simplicity, plain text or simple hash
  name: string;
  role: 'admin' | 'assistant';
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'excused';
  notes?: string;
}

export interface PaymentRecord {
  month: string; // e.g., "september", "october", "november"
  status: 'paid' | 'unpaid';
  amount: number;
  paymentDate?: string;
  recordedBy?: string;
  confirmed: boolean; // false = pending delivery, true = received
}

export interface MaterialRecord {
  id: string;
  name: string;
  status: 'paid' | 'unpaid';
  price: number;
  paymentDate?: string;
  recordedBy?: string;
  confirmed: boolean; // false = pending delivery, true = received
}

export interface ExamScoreRecord {
  examId: string;
  score: number;
}

export interface TermData {
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  materials: MaterialRecord[];
  exams: ExamScoreRecord[];
}

export interface Student {
  id: string; // Code
  name: string;
  phone: string;
  guardianPhone: string;
  grade: 1 | 2 | 3; // 1 = First Prep, 2 = Second Prep, 3 = Third Prep
  year: string; // e.g. "2026"
  isSuspended?: boolean;
  terms: {
    '1': TermData;
    '2': TermData;
  };
}

export interface Exam {
  id: string;
  name: string;
  grade: 1 | 2 | 3;
  maxScore: number;
  date: string;
  year: string;
  term: '1' | '2';
}

export interface FinancialLog {
  id: string;
  studentId: string;
  studentName: string;
  type: 'subscription' | 'material';
  itemName: string; // month name or booklet name
  amount: number;
  recordedBy: string;
  recordedAt: string;
  status: 'pending' | 'received';
  receivedAt?: string;
}

export interface DatabaseSchema {
  users: User[];
  years: string[];
  students: Student[];
  exams: Exam[];
  financialLogs: FinancialLog[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const INITIAL_MOCK_DATA: DatabaseSchema = {
  users: [
    { username: 'mohamed_hamed', passwordHash: 'mohamed123', name: 'مستر محمد حامد', role: 'admin' },
    { username: 'محمد حامد', passwordHash: 'mohamed123', name: 'مستر محمد حامد', role: 'admin' },
    { username: 'mimi', passwordHash: 'mimi123', name: 'مستر محمد حامد', role: 'admin' },
    { username: 'assistant', passwordHash: 'assistant123', name: 'أ. أحمد (المساعد)', role: 'assistant' }
  ],
  years: ['2026', '2027'],
  exams: [
    { id: 'exam-1', name: 'امتحان الجبر الأول', grade: 1, maxScore: 20, date: '2026-03-01', year: '2026', term: '1' },
    { id: 'exam-2', name: 'امتحان الهندسة الأول', grade: 2, maxScore: 20, date: '2026-03-05', year: '2026', term: '1' },
    { id: 'exam-3', name: 'امتحان حساب المثلثات الشامل', grade: 3, maxScore: 50, date: '2026-03-10', year: '2026', term: '1' }
  ],
  students: [
    {
      id: '1001',
      name: 'أحمد محمد علي',
      phone: '01012345678',
      guardianPhone: '01212345678',
      grade: 1,
      year: '2026',
      terms: {
        '1': {
          attendance: [
            { date: '2026-03-01', status: 'present' },
            { date: '2026-03-08', status: 'present' },
            { date: '2026-03-15', status: 'absent' }
          ],
          payments: [
            { month: 'سبتمبر', status: 'paid', amount: 150, paymentDate: '2026-03-01', recordedBy: 'assistant', confirmed: true },
            { month: 'أكتوبر', status: 'paid', amount: 150, paymentDate: '2026-03-08', recordedBy: 'assistant', confirmed: true },
            { month: 'نوفمبر', status: 'unpaid', amount: 150, confirmed: false }
          ],
          materials: [
            { id: 'm-1', name: 'مذكرة الجبر ترم أول', status: 'paid', price: 50, paymentDate: '2026-03-01', recordedBy: 'assistant', confirmed: true },
            { id: 'm-2', name: 'مذكرة الهندسة ترم أول', status: 'unpaid', price: 50, confirmed: false }
          ],
          exams: [
            { examId: 'exam-1', score: 18 }
          ]
        },
        '2': {
          attendance: [],
          payments: [
            { month: 'فبراير', status: 'unpaid', amount: 150, confirmed: false },
            { month: 'مارس', status: 'unpaid', amount: 150, confirmed: false }
          ],
          materials: [],
          exams: []
        }
      }
    },
    {
      id: '2000',
      name: 'محمد مصطفى كامل',
      phone: '01122334455',
      guardianPhone: '01555667788',
      grade: 2,
      year: '2026',
      terms: {
        '1': {
          attendance: [
            { date: '2026-03-01', status: 'present' },
            { date: '2026-03-08', status: 'excused', notes: 'ظرف طبي' }
          ],
          payments: [
            { month: 'سبتمبر', status: 'paid', amount: 150, paymentDate: '2026-03-01', recordedBy: 'assistant', confirmed: true }
          ],
          materials: [
            { id: 'm-3', name: 'مذكرة الهندسة ترم أول', status: 'paid', price: 50, paymentDate: '2026-03-01', recordedBy: 'assistant', confirmed: false }
          ],
          exams: [
            { examId: 'exam-2', score: 15 }
          ]
        },
        '2': {
          attendance: [],
          payments: [],
          materials: [],
          exams: []
        }
      }
    },
    {
      id: '3000',
      name: 'سارة يوسف الشافعي',
      phone: '01299887766',
      guardianPhone: '01033445566',
      grade: 3,
      year: '2026',
      terms: {
        '1': {
          attendance: [
            { date: '2026-03-01', status: 'present' },
            { date: '2026-03-08', status: 'present' }
          ],
          payments: [
            { month: 'سبتمبر', status: 'paid', amount: 150, paymentDate: '2026-03-01', recordedBy: 'assistant', confirmed: true },
            { month: 'أكتوبر', status: 'paid', amount: 150, paymentDate: '2026-03-08', recordedBy: 'assistant', confirmed: false }
          ],
          materials: [
            { id: 'm-4', name: 'مذكرة المراجعة النهائية', status: 'paid', price: 70, paymentDate: '2026-03-08', recordedBy: 'assistant', confirmed: false }
          ],
          exams: [
            { examId: 'exam-3', score: 48 }
          ]
        },
        '2': {
          attendance: [],
          payments: [],
          materials: [],
          exams: []
        }
      }
    }
  ],
  financialLogs: [
    {
      id: 'tx-1',
      studentId: '1001',
      studentName: 'أحمد محمد علي',
      type: 'subscription',
      itemName: 'سبتمبر',
      amount: 150,
      recordedBy: 'assistant',
      recordedAt: '2026-03-01T10:00:00Z',
      status: 'received',
      receivedAt: '2026-03-01T14:00:00Z'
    },
    {
      id: 'tx-2',
      studentId: '1001',
      studentName: 'أحمد محمد علي',
      type: 'material',
      itemName: 'مذكرة الجبر ترم أول',
      amount: 50,
      recordedBy: 'assistant',
      recordedAt: '2026-03-01T10:05:00Z',
      status: 'received',
      receivedAt: '2026-03-01T14:00:00Z'
    },
    {
      id: 'tx-3',
      studentId: '2000',
      studentName: 'محمد مصطفى كامل',
      type: 'material',
      itemName: 'مذكرة الهندسة ترم أول',
      amount: 50,
      recordedBy: 'assistant',
      recordedAt: '2026-03-01T10:10:00Z',
      status: 'pending'
    },
    {
      id: 'tx-4',
      studentId: '3000',
      studentName: 'سارة يوسف الشافعي',
      type: 'subscription',
      itemName: 'أكتوبر',
      amount: 150,
      recordedBy: 'assistant',
      recordedAt: '2026-03-08T09:30:00Z',
      status: 'pending'
    },
    {
      id: 'tx-5',
      studentId: '3000',
      studentName: 'سارة يوسف الشافعي',
      type: 'material',
      itemName: 'مذكرة المراجعة النهائية',
      amount: 70,
      recordedBy: 'assistant',
      recordedAt: '2026-03-08T09:35:00Z',
      status: 'pending'
    }
  ]
};

// Synchronous helper functions with automatic database initialization
export function getDb(): DatabaseSchema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_MOCK_DATA, null, 2), 'utf-8');
    return INITIAL_MOCK_DATA;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database file, resetting to mock data', error);
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_MOCK_DATA, null, 2), 'utf-8');
    return INITIAL_MOCK_DATA;
  }
}

export function saveDb(data: DatabaseSchema): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
