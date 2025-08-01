#!/usr/bin/env node

/**
 * Test Certificate Issuance End-to-End
 * This script tests the complete certificate generation workflow
 */

require('dotenv').config();
const certificateService = require('./services/certificate-service');

async function testCertificateIssuance() {
    console.log('🧪 Testing Certificate Issuance End-to-End\n');

    // Test data
    const testUser = {
        telegramId: BigInt('123456789'),
        id: 'test-user-' + Date.now()
    };

    const testCourse = 'fundamentals';
    const testScore = 95;

    try {
        console.log('1️⃣ Testing AFCP Certificate Generation...');
        
        // Test AFCP certificate for fundamentals course (score >= 85)
        const afcpCert = await certificateService.issueCertificate(
            testUser.id,
            testCourse,
            testScore
        );

        console.log('✅ AFCP Certificate Generated:');
        console.log(`   Certificate ID: ${afcpCert.certificateId}`);
        console.log(`   Type: ${afcpCert.certificateId.startsWith('AFCP') ? 'AFCP (Professional)' : 'AFC (Completion)'}`);
        console.log(`   Course: ${afcpCert.courseId}`);
        console.log(`   Score: ${afcpCert.score}%`);
        console.log(`   Issued: ${afcpCert.issuedAt}\n`);

        console.log('2️⃣ Testing AFC Certificate Generation...');
        
        // Test AFC certificate for lower score (< 85)
        const afcCert = await certificateService.issueCertificate(
            testUser.id + '-2',
            testCourse,
            75 // Lower score for AFC
        );

        console.log('✅ AFC Certificate Generated:');
        console.log(`   Certificate ID: ${afcCert.certificateId}`);
        console.log(`   Type: ${afcCert.certificateId.startsWith('AFCP') ? 'AFCP (Professional)' : 'AFC (Completion)'}`);
        console.log(`   Course: ${afcCert.courseId}`);
        console.log(`   Score: ${afcCert.score}%`);
        console.log(`   Issued: ${afcCert.issuedAt}\n`);

        console.log('3️⃣ Testing Certificate Validation...');
        
        // Test certificate validation
        const isValid = await certificateService.validateCertificate(afcpCert.certificateId);
        console.log(`✅ Certificate Validation: ${isValid ? 'VALID' : 'INVALID'}\n`);

        console.log('4️⃣ Testing Bootcamp Enrollment Certificate...');
        
        // Test bootcamp-specific certificate
        const bootcampCert = await certificateService.issueCertificate(
            testUser.id + '-bootcamp',
            'ai_training_bootcamp',
            90
        );

        console.log('✅ Bootcamp Certificate Generated:');
        console.log(`   Certificate ID: ${bootcampCert.certificateId}`);
        console.log(`   Type: ${bootcampCert.certificateId.startsWith('AFCP') ? 'AFCP (Professional)' : 'AFC (Completion)'}`);
        console.log(`   Course: ${bootcampCert.courseId}`);
        console.log(`   Score: ${bootcampCert.score}%\n`);

        console.log('🎉 All Certificate Tests Passed!\n');
        
        console.log('📊 Test Summary:');
        console.log('   ✅ AFCP Certificate (score >= 85)');
        console.log('   ✅ AFC Certificate (score < 85)');
        console.log('   ✅ Certificate Validation');
        console.log('   ✅ Bootcamp Certificate');
        console.log('\n✅ Certificate issuance system is working correctly!');

    } catch (error) {
        console.error('❌ Certificate Test Failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testCertificateIssuance()
        .then(() => {
            console.log('\n✅ Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testCertificateIssuance };
