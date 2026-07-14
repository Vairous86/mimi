<?php
// Mr. Mohamed Hamed Academy API Endpoint Controller
// Configured to accept connections from any domain (CORS Allowed)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_connect.php';

// Auto-migration: check if 'subscriptionFee' column exists in 'students' table
try {
    $checkCol = $pdo->query("SHOW COLUMNS FROM students LIKE 'subscriptionFee'");
    if ($checkCol->rowCount() === 0) {
        $pdo->exec("ALTER TABLE students ADD COLUMN subscriptionFee INT DEFAULT 150");
    }
} catch (Exception $e) {
    // Ignore migration errors to avoid breaking API
}

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// GET METHOD: Exposes full DB structure
// ==========================================
if ($method === 'GET') {
    try {
        // 1. Fetch Users
        $stmt = $pdo->query("SELECT username, name, role FROM users");
        $users = $stmt->fetchAll();

        // 2. Fetch Years
        $stmt = $pdo->query("SELECT year FROM years");
        $yearsRaw = $stmt->fetchAll();
        $years = array_column($yearsRaw, 'year');
        rsort($years); // Sort years descending

        // 3. Fetch Exams
        $stmt = $pdo->query("SELECT * FROM exams");
        $examsRaw = $stmt->fetchAll();
        $exams = [];
        foreach ($examsRaw as $ex) {
            $ex['grade'] = (int)$ex['grade'];
            $ex['maxScore'] = (int)$ex['maxScore'];
            $exams[] = $ex;
        }

        // 4. Fetch Financial Logs
        $stmt = $pdo->query("SELECT * FROM financial_logs ORDER BY recordedAt DESC");
        $logsRaw = $stmt->fetchAll();
        $financialLogs = [];
        foreach ($logsRaw as $log) {
            $log['amount'] = (int)$log['amount'];
            $financialLogs[] = $log;
        }

        // 5. Fetch Student Sub-records for nesting
        // Attendance
        $stmt = $pdo->query("SELECT * FROM attendance");
        $attendanceRaw = $stmt->fetchAll();
        $attendanceGrouped = [];
        foreach ($attendanceRaw as $att) {
            $sId = $att['studentId'];
            $term = $att['term'];
            unset($att['studentId'], $att['term']);
            $attendanceGrouped[$sId][$term][] = $att;
        }

        // Payments
        $stmt = $pdo->query("SELECT * FROM payments");
        $paymentsRaw = $stmt->fetchAll();
        $paymentsGrouped = [];
        foreach ($paymentsRaw as $pay) {
            $sId = $pay['studentId'];
            $term = $pay['term'];
            $pay['amount'] = (int)$pay['amount'];
            $pay['confirmed'] = (bool)$pay['confirmed'];
            unset($pay['studentId'], $pay['term']);
            $paymentsGrouped[$sId][$term][] = $pay;
        }

        // Materials
        $stmt = $pdo->query("SELECT * FROM materials");
        $materialsRaw = $stmt->fetchAll();
        $materialsGrouped = [];
        foreach ($materialsRaw as $mat) {
            $sId = $mat['studentId'];
            $term = $mat['term'];
            $mat['price'] = (int)$mat['price'];
            $mat['confirmed'] = (bool)$mat['confirmed'];
            unset($mat['studentId'], $mat['term']);
            $materialsGrouped[$sId][$term][] = $mat;
        }

        // Exam scores joined with exams to get the term
        $stmt = $pdo->query("SELECT es.studentId, es.examId, es.score, e.term FROM exam_scores es JOIN exams e ON es.examId = e.id");
        $scoresRaw = $stmt->fetchAll();
        $scoresGrouped = [];
        foreach ($scoresRaw as $sc) {
            $sId = $sc['studentId'];
            $term = $sc['term'];
            $sc['score'] = (int)$sc['score'];
            unset($sc['studentId'], $sc['term']);
            $scoresGrouped[$sId][$term][] = $sc;
        }

        // 6. Fetch Students
        $stmt = $pdo->query("SELECT * FROM students");
        $studentsRaw = $stmt->fetchAll();
        $students = [];
        foreach ($studentsRaw as $s) {
            $sId = $s['id'];
            $s['grade'] = (int)$s['grade'];
            $s['isSuspended'] = (bool)$s['isSuspended'];

            $s['terms'] = [
                '1' => [
                    'attendance' => isset($attendanceGrouped[$sId]['1']) ? $attendanceGrouped[$sId]['1'] : [],
                    'payments' => isset($paymentsGrouped[$sId]['1']) ? $paymentsGrouped[$sId]['1'] : [],
                    'materials' => isset($materialsGrouped[$sId]['1']) ? $materialsGrouped[$sId]['1'] : [],
                    'exams' => isset($scoresGrouped[$sId]['1']) ? $scoresGrouped[$sId]['1'] : []
                ],
                '2' => [
                    'attendance' => isset($attendanceGrouped[$sId]['2']) ? $attendanceGrouped[$sId]['2'] : [],
                    'payments' => isset($paymentsGrouped[$sId]['2']) ? $paymentsGrouped[$sId]['2'] : [],
                    'materials' => isset($materialsGrouped[$sId]['2']) ? $materialsGrouped[$sId]['2'] : [],
                    'exams' => isset($scoresGrouped[$sId]['2']) ? $scoresGrouped[$sId]['2'] : []
                ]
            ];
            $students[] = $s;
        }

        echo json_encode([
            'users' => $users,
            'years' => $years,
            'students' => $students,
            'exams' => $exams,
            'financialLogs' => $financialLogs
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// ==========================================
// POST METHOD: Handles state mutations
// ==========================================
if ($method === 'POST') {
    // Read JSON raw payload body
    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);

    if (!$body || !isset($body['action'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action or request body']);
        exit;
    }

    $action = $body['action'];

    try {
        // 1. ACTION: LOGIN
        if ($action === 'login') {
            $username = $body['username'] ?? '';
            $password = $body['password'] ?? '';

            $stmt = $pdo->prepare("SELECT username, name, role FROM users WHERE username = ? AND passwordHash = ?");
            $stmt->execute([$username, $password]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'اسم المستخدم أو كلمة المرور غير صحيحة']);
                exit;
            }
            echo json_encode($user);
            exit;
        }

        // 2. ACTION: ADD YEAR
        if ($action === 'addYear') {
            $year = $body['year'] ?? '';
            if (!$year) {
                http_response_code(400);
                echo json_encode(['error' => 'السنة مطلوبة']);
                exit;
            }

            // Check if year already exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM years WHERE year = ?");
            $stmt->execute([$year]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'السنة الدراسية موجودة بالفعل']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO years (year) VALUES (?)");
            $stmt->execute([$year]);

            // Return current list of years descending
            $stmt = $pdo->query("SELECT year FROM years");
            $yearsRaw = $stmt->fetchAll();
            $years = array_column($yearsRaw, 'year');
            rsort($years);

            echo json_encode(['success' => true, 'years' => $years]);
            exit;
        }

        // 3. ACTION: ADD STUDENT
        if ($action === 'addStudent') {
            $student = $body['student'] ?? null;
            if (!$student || !isset($student['name']) || !isset($student['grade']) || !isset($student['year'])) {
                http_response_code(400);
                echo json_encode(['error' => 'بيانات الطالب غير مكتملة']);
                exit;
            }

            $gradeNum = (int)$student['grade'];
            $baseId = $gradeNum * 1000;

            // Generate auto student ID in range [baseId, baseId + 1000)
            $stmt = $pdo->prepare("SELECT id FROM students WHERE grade = ?");
            $stmt->execute([$gradeNum]);
            $ids = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));

            $maxId = count($ids) > 0 ? max($ids) : ($baseId - 1);
            $generatedId = (string)($maxId + 1);

            // Double check uniqueness globally
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE id = ?");
            $stmt->execute([$generatedId]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'حدث تضارب في أرقام الكود التلقائية، يرجى المحاولة لاحقاً']);
                exit;
            }

            $subscriptionFee = isset($student['subscriptionFee']) ? (int)$student['subscriptionFee'] : 150;

            // Insert Student
            $stmt = $pdo->prepare("INSERT INTO students (id, name, phone, guardianPhone, grade, year, isSuspended, subscriptionFee) VALUES (?, ?, ?, ?, ?, ?, 0, ?)");
            $stmt->execute([
                $generatedId,
                $student['name'],
                $student['phone'] ?? '',
                $student['guardianPhone'] ?? '',
                $gradeNum,
                $student['year'],
                $subscriptionFee
            ]);

            // Add default unpaid payments for Term 1 (Sept, Oct, Nov, Dec)
            $defaultTerm1 = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            $payStmt = $pdo->prepare("INSERT INTO payments (studentId, month, status, amount, term, confirmed) VALUES (?, ?, 'unpaid', ?, '1', 0)");
            foreach ($defaultTerm1 as $m) {
                $payStmt->execute([$generatedId, $m, $subscriptionFee]);
            }

            // Add default unpaid payments for Term 2 (Jan, Feb, Mar, Apr, May)
            $defaultTerm2 = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];
            $payStmt2 = $pdo->prepare("INSERT INTO payments (studentId, month, status, amount, term, confirmed) VALUES (?, ?, 'unpaid', ?, '2', 0)");
            foreach ($defaultTerm2 as $m) {
                $payStmt2->execute([$generatedId, $m, $subscriptionFee]);
            }

            // Construct new student profile output object
            $termsData = [
                '1' => [
                    'attendance' => [],
                    'payments' => array_map(function($m) use ($subscriptionFee) { return ['month' => $m, 'status' => 'unpaid', 'amount' => $subscriptionFee, 'confirmed' => false]; }, $defaultTerm1),
                    'materials' => [],
                    'exams' => []
                ],
                '2' => [
                    'attendance' => [],
                    'payments' => array_map(function($m) use ($subscriptionFee) { return ['month' => $m, 'status' => 'unpaid', 'amount' => $subscriptionFee, 'confirmed' => false]; }, $defaultTerm2),
                    'materials' => [],
                    'exams' => []
                ]
            ];

            echo json_encode([
                'success' => true,
                'student' => [
                    'id' => $generatedId,
                    'name' => $student['name'],
                    'phone' => $student['phone'] ?? '',
                    'guardianPhone' => $student['guardianPhone'] ?? '',
                    'grade' => $gradeNum,
                    'year' => $student['year'],
                    'isSuspended' => false,
                    'subscriptionFee' => $subscriptionFee,
                    'terms' => $termsData
                ]
            ]);
            exit;
        }

        // 4. ACTION: UPDATE STUDENT
        if ($action === 'updateStudent') {
            $id = $body['id'] ?? '';
            $year = $body['year'] ?? '';
            $name = $body['name'] ?? null;
            $phone = $body['phone'] ?? null;
            $guardianPhone = $body['guardianPhone'] ?? null;
            $grade = $body['grade'] ?? null;

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE id = ? AND year = ?");
            $stmt->execute([$id, $year]);
            if ($stmt->fetchColumn() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'الطالب غير موجود']);
                exit;
            }

            // Build dynamic update set
            $updates = [];
            $params = [];
            if ($name !== null) { $updates[] = "name = ?"; $params[] = $name; }
            if ($phone !== null) { $updates[] = "phone = ?"; $params[] = $phone; }
            if ($guardianPhone !== null) { $updates[] = "guardianPhone = ?"; $params[] = $guardianPhone; }
            if ($grade !== null) { $updates[] = "grade = ?"; $params[] = (int)$grade; }

            if (count($updates) > 0) {
                $params[] = $id;
                $params[] = $year;
                $sql = "UPDATE students SET " . implode(", ", $updates) . " WHERE id = ? AND year = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            echo json_encode(['success' => true]);
            exit;
        }

        // 5. ACTION: TOGGLE SUSPENSION
        if ($action === 'toggleSuspension') {
            $studentId = $body['studentId'] ?? '';
            $year = $body['year'] ?? '';

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE id = ? AND year = ?");
            $stmt->execute([$studentId, $year]);
            if ($stmt->fetchColumn() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'الطالب غير موجود']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE students SET isSuspended = NOT isSuspended WHERE id = ? AND year = ?");
            $stmt->execute([$studentId, $year]);

            echo json_encode(['success' => true]);
            exit;
        }

        // 6. ACTION: MARK ATTENDANCE
        if ($action === 'markAttendance') {
            $studentId = $body['studentId'] ?? '';
            $date = $body['date'] ?? '';
            $status = $body['status'] ?? '';
            $notes = $body['notes'] ?? '';
            $term = $body['term'] ?? '1';

            $stmt = $pdo->prepare("INSERT INTO attendance (studentId, date, status, notes, term) VALUES (?, ?, ?, ?, ?) 
                                   ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)");
            $stmt->execute([$studentId, $date, $status, $notes, $term]);

            echo json_encode(['success' => true]);
            exit;
        }

        // 7. ACTION: MARK PAYMENT
        if ($action === 'markPayment') {
            $studentId = $body['studentId'] ?? '';
            $year = $body['year'] ?? '';
            $term = $body['term'] ?? '1';
            $month = $body['month'] ?? '';
            $status = $body['status'] ?? 'unpaid';
            $amount = $body['amount'] ?? 150;
            $recordedBy = $body['recordedBy'] ?? '';
            $role = $body['role'] ?? 'assistant';

            $confirmed = ($role === 'admin') ? 1 : 0;
            $paymentDate = ($status === 'paid') ? date('Y-m-d H:i:s') : null;

            // Fetch old payment status to detect status shift
            $stmt = $pdo->prepare("SELECT status FROM payments WHERE studentId = ? AND month = ? AND term = ?");
            $stmt->execute([$studentId, $month, $term]);
            $oldStatus = $stmt->fetchColumn();

            if ($oldStatus !== false) {
                $stmt = $pdo->prepare("UPDATE payments SET status = ?, amount = ?, paymentDate = ?, recordedBy = ?, confirmed = ? WHERE studentId = ? AND month = ? AND term = ?");
                $stmt->execute([$status, $amount, $paymentDate, $recordedBy, $confirmed, $studentId, $month, $term]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO payments (studentId, month, status, amount, paymentDate, recordedBy, confirmed, term) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$studentId, $month, $status, $amount, $paymentDate, $recordedBy, $confirmed, $term]);
            }

            // Create Financial Transaction Log on "unpaid -> paid" transition
            if ($status === 'paid' && $oldStatus !== 'paid') {
                // Fetch student name
                $stmt = $pdo->prepare("SELECT name FROM students WHERE id = ? AND year = ?");
                $stmt->execute([$studentId, $year]);
                $studentName = $stmt->fetchColumn();

                $logId = 'tx-' . round(microtime(true) * 1000) . '-' . substr(md5(uniqid(rand(), true)), 0, 9);
                $logStatus = $confirmed ? 'received' : 'pending';
                $receivedDate = $confirmed ? date('Y-m-d H:i:s') : null;

                $stmt = $pdo->prepare("INSERT INTO financial_logs (id, studentId, studentName, type, itemName, amount, recordedBy, recordedAt, status, receivedAt) VALUES (?, ?, ?, 'subscription', ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $logId, $studentId, $studentName, $month, $amount, $recordedBy, date('Y-m-d H:i:s'), $logStatus, $receivedDate
                ]);
            }

            // Remove from Financial logs on "paid -> unpaid" transition
            if ($status !== 'paid' && $oldStatus === 'paid') {
                $stmt = $pdo->prepare("DELETE FROM financial_logs WHERE studentId = ? AND type = 'subscription' AND itemName = ?");
                $stmt->execute([$studentId, $month]);
            }

            echo json_encode(['success' => true]);
            exit;
        }

        // 8. ACTION: MARK MATERIAL (Booklet/Material Payment)
        if ($action === 'markMaterial') {
            $studentId = $body['studentId'] ?? '';
            $year = $body['year'] ?? '';
            $term = $body['term'] ?? '1';
            $materialId = $body['materialId'] ?? '';
            $materialName = $body['materialName'] ?? '';
            $status = $body['status'] ?? 'unpaid';
            $price = $body['price'] ?? 50;
            $recordedBy = $body['recordedBy'] ?? '';
            $role = $body['role'] ?? 'assistant';

            $confirmed = ($role === 'admin') ? 1 : 0;
            $paymentDate = ($status === 'paid') ? date('Y-m-d H:i:s') : null;

            // Fetch old material status to detect status shift
            $stmt = $pdo->prepare("SELECT status FROM materials WHERE id = ?");
            $stmt->execute([$materialId]);
            $oldStatus = $stmt->fetchColumn();

            if ($oldStatus !== false) {
                $stmt = $pdo->prepare("UPDATE materials SET status = ?, price = ?, paymentDate = ?, recordedBy = ?, confirmed = ? WHERE id = ?");
                $stmt->execute([$status, $price, $paymentDate, $recordedBy, $confirmed, $materialId]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO materials (id, studentId, name, status, price, paymentDate, recordedBy, confirmed, term) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$materialId, $studentId, $materialName, $status, $price, $paymentDate, $recordedBy, $confirmed, $term]);
            }

            // Create Financial Transaction Log on "unpaid -> paid" transition
            if ($status === 'paid' && $oldStatus !== 'paid') {
                // Fetch student name
                $stmt = $pdo->prepare("SELECT name FROM students WHERE id = ? AND year = ?");
                $stmt->execute([$studentId, $year]);
                $studentName = $stmt->fetchColumn();

                $logId = 'tx-' . round(microtime(true) * 1000) . '-' . substr(md5(uniqid(rand(), true)), 0, 9);
                $logStatus = $confirmed ? 'received' : 'pending';
                $receivedDate = $confirmed ? date('Y-m-d H:i:s') : null;

                $stmt = $pdo->prepare("INSERT INTO financial_logs (id, studentId, studentName, type, itemName, amount, recordedBy, recordedAt, status, receivedAt) VALUES (?, ?, ?, 'material', ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $logId, $studentId, $studentName, $materialName, $price, $recordedBy, date('Y-m-d H:i:s'), $logStatus, $receivedDate
                ]);
            }

            // Remove from Financial logs on "paid -> unpaid" transition
            if ($status !== 'paid' && $oldStatus === 'paid') {
                $stmt = $pdo->prepare("DELETE FROM financial_logs WHERE studentId = ? AND type = 'material' AND itemName = ?");
                $stmt->execute([$studentId, $materialName]);
            }

            echo json_encode(['success' => true]);
            exit;
        }

        // 9. ACTION: ADD EXAM
        if ($action === 'addExam') {
            $exam = $body['exam'] ?? null;
            if (!$exam || !isset($exam['id']) || !isset($exam['name']) || !isset($exam['grade']) || !isset($exam['maxScore']) || !isset($exam['date']) || !isset($exam['year']) || !isset($exam['term'])) {
                http_response_code(400);
                echo json_encode(['error' => 'بيانات الامتحان غير مكتملة']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO exams (id, name, grade, maxScore, date, year, term) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $exam['id'],
                $exam['name'],
                (int)$exam['grade'],
                (int)$exam['maxScore'],
                $exam['date'],
                $exam['year'],
                $exam['term']
            ]);

            echo json_encode(['success' => true]);
            exit;
        }

        // 10. ACTION: ENTER EXAM SCORES
        if ($action === 'enterExamScores') {
            $examId = $body['examId'] ?? '';
            $scores = $body['scores'] ?? []; // Map of { studentId: score }

            $stmt = $pdo->prepare("INSERT INTO exam_scores (studentId, examId, score) VALUES (?, ?, ?) 
                                   ON DUPLICATE KEY UPDATE score = VALUES(score)");
            foreach ($scores as $sId => $scoreVal) {
                $stmt->execute([$sId, $examId, (int)$scoreVal]);
            }

            echo json_encode(['success' => true]);
            exit;
        }

        // 11. ACTION: ROLLOVER YEAR (Promotion)
        if ($action === 'rolloverYear') {
            $fromYear = $body['fromYear'] ?? '';
            $toYear = $body['toYear'] ?? '';

            if (!$fromYear || !$toYear) {
                http_response_code(400);
                echo json_encode(['error' => 'السنوات المطلوبة غير محددة']);
                exit;
            }

            // Ensure toYear exists in years table
            $stmt = $pdo->prepare("INSERT IGNORE INTO years (year) VALUES (?)");
            $stmt->execute([$toYear]);

            // Fetch students from fromYear
            $stmt = $pdo->prepare("SELECT * FROM students WHERE year = ?");
            $stmt->execute([$fromYear]);
            $studentsToRollover = $stmt->fetchAll();

            foreach ($studentsToRollover as $student) {
                $oldGrade = (int)$student['grade'];
                if ($oldGrade === 3) {
                    continue; // Grade 3 students graduate and do not rollover
                }
                $newGrade = $oldGrade + 1;
                $baseId = $newGrade * 1000;

                // Generate new ID for student in the new grade range
                $stmtId = $pdo->prepare("SELECT id FROM students WHERE grade = ?");
                $stmtId->execute([$newGrade]);
                $ids = array_map('intval', $stmtId->fetchAll(PDO::FETCH_COLUMN));

                $maxId = count($ids) > 0 ? max($ids) : ($baseId - 1);
                $newId = (string)($maxId + 1);

                $subscriptionFee = isset($student['subscriptionFee']) ? (int)$student['subscriptionFee'] : 150;

                // Insert into students table for toYear
                $stmtInsert = $pdo->prepare("INSERT INTO students (id, name, phone, guardianPhone, grade, year, isSuspended, subscriptionFee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmtInsert->execute([
                    $newId,
                    $student['name'],
                    $student['phone'],
                    $student['guardianPhone'],
                    $newGrade,
                    $toYear,
                    $student['isSuspended'],
                    $subscriptionFee
                ]);

                // Create default unpaid payments for rolled over students
                $defaultTerm1 = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                $payStmt = $pdo->prepare("INSERT INTO payments (studentId, month, status, amount, term, confirmed) VALUES (?, ?, 'unpaid', ?, '1', 0)");
                foreach ($defaultTerm1 as $m) {
                    $payStmt->execute([$newId, $m, $subscriptionFee]);
                }

                $defaultTerm2 = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];
                $payStmt2 = $pdo->prepare("INSERT INTO payments (studentId, month, status, amount, term, confirmed) VALUES (?, ?, 'unpaid', ?, '2', 0)");
                foreach ($defaultTerm2 as $m) {
                    $payStmt2->execute([$newId, $m, $subscriptionFee]);
                }
            }

            echo json_encode(['success' => true]);
            exit;
        }

        // 12. ACTION: CONFIRM FINANCIALS (Admin acceptance validation)
        if ($action === 'confirmFinancials') {
            $logId = $body['logId'] ?? '';
            $role = $body['role'] ?? '';

            if ($role !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'غير مصرح للقيام بهذا الإجراء']);
                exit;
            }

            // Fetch transaction details
            $stmt = $pdo->prepare("SELECT * FROM financial_logs WHERE id = ?");
            $stmt->execute([$logId]);
            $log = $stmt->fetch();

            if (!$log) {
                http_response_code(404);
                echo json_encode(['error' => 'المعاملة غير موجودة']);
                exit;
            }

            // Update log validation status
            $stmt = $pdo->prepare("UPDATE financial_logs SET status = 'received', receivedAt = ? WHERE id = ?");
            $stmt->execute([date('Y-m-d H:i:s'), $logId]);

            // Propagate confirmation back to payments or materials
            if ($log['type'] === 'subscription') {
                // Infer the term based on the month name
                $term = in_array($log['itemName'], ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو']) ? '2' : '1';
                $stmt = $pdo->prepare("UPDATE payments SET confirmed = 1 WHERE studentId = ? AND month = ? AND term = ?");
                $stmt->execute([$log['studentId'], $log['itemName'], $term]);
            } else if ($log['type'] === 'material') {
                $stmt = $pdo->prepare("UPDATE materials SET confirmed = 1 WHERE studentId = ? AND name = ?");
                $stmt->execute([$log['studentId'], $log['itemName']]);
            }

            echo json_encode(['success' => true]);
            exit;
        }

        // 13. ACTION: PARENT QUERY (Student Lookup Portal)
        if ($action === 'parentQuery') {
            $studentId = $body['studentId'] ?? '';
            if (!$studentId) {
                http_response_code(400);
                echo json_encode(['error' => 'كود الطالب مطلوب']);
                exit;
            }

            // Fetch student
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch();

            if (!$student) {
                http_response_code(404);
                echo json_encode(['error' => 'كود الطالب غير صحيح أو غير مسجل في أكاديمية مستر محمد حامد']);
                exit;
            }

            $sId = $student['id'];
            $student['grade'] = (int)$student['grade'];
            $student['isSuspended'] = (bool)$student['isSuspended'];

            // Fetch student attendance
            $stmt = $pdo->prepare("SELECT * FROM attendance WHERE studentId = ?");
            $stmt->execute([$sId]);
            $attList = $stmt->fetchAll();
            $attendanceGrouped = ['1' => [], '2' => []];
            foreach ($attList as $att) {
                $term = $att['term'];
                unset($att['studentId'], $att['term']);
                $attendanceGrouped[$term][] = $att;
            }

            // Fetch student payments
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE studentId = ?");
            $stmt->execute([$sId]);
            $payList = $stmt->fetchAll();
            $paymentsGrouped = ['1' => [], '2' => []];
            foreach ($payList as $pay) {
                $term = $pay['term'];
                $pay['amount'] = (int)$pay['amount'];
                $pay['confirmed'] = (bool)$pay['confirmed'];
                unset($pay['studentId'], $pay['term']);
                $paymentsGrouped[$term][] = $pay;
            }

            // Fetch student materials
            $stmt = $pdo->prepare("SELECT * FROM materials WHERE studentId = ?");
            $stmt->execute([$sId]);
            $matList = $stmt->fetchAll();
            $materialsGrouped = ['1' => [], '2' => []];
            foreach ($matList as $mat) {
                $term = $mat['term'];
                $mat['price'] = (int)$mat['price'];
                $mat['confirmed'] = (bool)$mat['confirmed'];
                unset($mat['studentId'], $mat['term']);
                $materialsGrouped[$term][] = $mat;
            }

            // Fetch student scores joined with exams
            $stmt = $pdo->prepare("SELECT es.examId, es.score, e.term FROM exam_scores es JOIN exams e ON es.examId = e.id WHERE es.studentId = ?");
            $stmt->execute([$sId]);
            $scoresList = $stmt->fetchAll();
            $scoresGrouped = ['1' => [], '2' => []];
            foreach ($scoresList as $sc) {
                $term = $sc['term'];
                $sc['score'] = (int)$sc['score'];
                unset($sc['term']);
                $scoresGrouped[$term][] = $sc;
            }

            // Construct terms structure
            $student['terms'] = [
                '1' => [
                    'attendance' => $attendanceGrouped['1'],
                    'payments' => $paymentsGrouped['1'],
                    'materials' => $materialsGrouped['1'],
                    'exams' => $scoresGrouped['1']
                ],
                '2' => [
                    'attendance' => $attendanceGrouped['2'],
                    'payments' => $paymentsGrouped['2'],
                    'materials' => $materialsGrouped['2'],
                    'exams' => $scoresGrouped['2']
                ]
            ];

            // Fetch exams for this student's grade and year
            $stmt = $pdo->prepare("SELECT * FROM exams WHERE grade = ? AND year = ?");
            $stmt->execute([$student['grade'], $student['year']]);
            $examsRaw = $stmt->fetchAll();
            $exams = [];
            foreach ($examsRaw as $ex) {
                $ex['grade'] = (int)$ex['grade'];
                $ex['maxScore'] = (int)$ex['maxScore'];
                $exams[] = $ex;
            }

            echo json_encode([
                'success' => true,
                'student' => $student,
                'exams' => $exams
            ]);
            exit;
        }

        // Action not recognized
        http_response_code(400);
        echo json_encode(['error' => 'Action not recognized']);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
