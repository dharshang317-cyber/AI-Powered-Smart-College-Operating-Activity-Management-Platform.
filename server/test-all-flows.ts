import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Full Acceptance Test Suite (including Real-Time Auth & OTP)...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    console.log('1. Testing System Health & Connectivity...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.data.status === 'online', 'System is online and responding');

    // 2. Public Directory
    console.log('\n2. Testing Public College & Department Directory...');
    const collegesRes = await axios.get(`${API_BASE}/auth/colleges`);
    assert(collegesRes.data.colleges.length > 0, `Colleges found: ${collegesRes.data.colleges.length}`);
    const demoCollege = collegesRes.data.colleges[0];
    assert(demoCollege.name === 'CampusNexus Demo Arts & Science College', 'Demo college retrieved');

    const deptsRes = await axios.get(`${API_BASE}/auth/departments/${demoCollege.id}`);
    assert(deptsRes.data.departments.length >= 6, `Departments retrieved: ${deptsRes.data.departments.length}`);
    const itDept = deptsRes.data.departments.find((d: any) => d.code === 'IT');

    // 3. Email OTP Generation & Verification
    console.log('\n3. Testing Real-Time Email OTP Verification System...');
    const testEmail = `new.student.${Date.now()}@test.edu`;
    const sendOtpRes = await axios.post(`${API_BASE}/auth/send-otp`, {
      email: testEmail,
      purpose: 'REGISTRATION',
      collegeName: demoCollege.name,
      userName: 'Candidate Student',
    });
    assert(sendOtpRes.data.success === true, '6-digit OTP successfully generated and dispatched');
    const otpCode = sendOtpRes.data.devPreviewOtp;
    assert(otpCode && otpCode.length === 6, `Valid 6-digit OTP code received: ${otpCode}`);

    // Verify OTP with wrong code first -> expect failure
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        email: testEmail,
        otpCode: '000000',
        purpose: 'REGISTRATION',
      });
      assert(false, 'Invalid OTP was accepted');
    } catch (err: any) {
      assert(err.response?.status === 400, 'Invalid OTP code correctly rejected');
    }

    // Verify OTP with correct code -> expect success
    const verifyOtpRes = await axios.post(`${API_BASE}/auth/verify-otp`, {
      email: testEmail,
      otpCode,
      purpose: 'REGISTRATION',
    });
    assert(verifyOtpRes.data.success === true, 'Valid 6-digit OTP verified successfully');

    const testPhone = '+91' + Math.floor(6000000000 + Math.random() * 3999999999);
    const studentRegRes = await axios.post(`${API_BASE}/auth/register-student`, {
      collegeId: demoCollege.id,
      departmentId: itDept.id,
      fullName: 'Real Student Candidate',
      email: testEmail,
      phone: testPhone,
      password: 'Password@123',
      course: 'B.Sc Information Technology',
      year: 'I Year',
      section: 'Section A',
      rollNumber: `26IT${Math.floor(100 + Math.random() * 899)}`,
    });
    assert(studentRegRes.data.status === 'PENDING', 'Student registration submitted in PENDING state');

    // 5. Admin Approval Flow
    console.log('\n5. Testing Administrator Approval of Registered Student...');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@campusnexus.edu',
      password: 'Admin@123',
    });
    const adminToken = adminLoginRes.data.token;
    const adminAuthHeader = { headers: { Authorization: `Bearer ${adminToken}` } };

    const approveRes = await axios.post(
      `${API_BASE}/admin/approve-user`,
      { userId: studentRegRes.data.userId },
      adminAuthHeader
    );
    assert(approveRes.data.user.status === 'APPROVED', 'Administrator approved student successfully');

    // 6. Test Login via Phone Number + Password
    console.log('\n6. Testing Login via Phone Number + Password...');
    const phoneLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      phone: testPhone,
      password: 'Password@123',
    });
    assert(phoneLoginRes.data.user.email.toLowerCase() === testEmail.toLowerCase(), 'Login via mobile phone number authenticated successfully');

    // 7. Test Passwordless Email OTP Login
    console.log('\n7. Testing Passwordless Login via Email OTP...');
    const loginOtpDispatch = await axios.post(`${API_BASE}/auth/send-otp`, {
      email: testEmail,
      purpose: 'LOGIN',
    });
    const loginOtpCode = loginOtpDispatch.data.devPreviewOtp;

    const emailOtpLoginRes = await axios.post(`${API_BASE}/auth/login-otp`, {
      email: testEmail,
      otpCode: loginOtpCode,
    });
    assert(emailOtpLoginRes.data.token && emailOtpLoginRes.data.user.role === 'STUDENT', 'Passwordless Email OTP login authenticated successfully');

    // 8. Test Google OAuth Verification Endpoint
    console.log('\n8. Testing Google OAuth Login Endpoint...');
    const mockGoogleToken = btoa(JSON.stringify({
      email: testEmail,
      name: 'Real Student Candidate',
      sub: 'google_test_sub_' + Date.now(),
      email_verified: true,
    }));
    const googleLoginRes = await axios.post(`${API_BASE}/auth/google-login`, {
      credential: `header.${mockGoogleToken}.signature`,
    });
    assert(googleLoginRes.data.token && googleLoginRes.data.user.email === testEmail, 'Google OAuth token authenticated existing student successfully');

    // 9. Faculty Workflow (Smart Classroom, Attendance, Quiz Generator)
    console.log('\n9. Testing Faculty Workflow & 1-Click AI Quiz Generator...');
    const facultyLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'faculty.it@campusnexus.edu',
      password: 'Demo@1234',
    });
    const facultyAuth = { headers: { Authorization: `Bearer ${facultyLogin.data.token}` } };

    const aiQuiz = await axios.post(
      `${API_BASE}/ai/generate-quiz`,
      { topic: 'Database Normalization' },
      facultyAuth
    );
    assert(aiQuiz.data.generatedQuiz?.questions?.length === 10, 'AI generated 10 MCQs with questions, options, and explanations');

    console.log('\n======================================================');
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Fatal test error:', err.response?.data || err.message);
    failed++;
  }
}

runTests();
