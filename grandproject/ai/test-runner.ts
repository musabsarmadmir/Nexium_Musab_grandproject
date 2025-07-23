#!/usr/bin/env node

// CLI script to test AI functionality
// Run with: npm run test-ai

import { testRunner, runQuickTest } from './test-suite'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'quick'

  console.log('🎯 Resume Tailor AI Test Runner')
  console.log('================================\n')

  switch (command) {
    case 'quick':
      await runQuickTest()
      break
      
    case 'full':
      await testRunner.runAllTests()
      testRunner.generateTestReport()
      break
      
    case 'performance':
      await testRunner.performanceTest()
      break
      
    default:
      console.log('Available commands:')
      console.log('  quick      - Run quick functionality test')
      console.log('  full       - Run complete test suite')
      console.log('  performance - Run performance benchmarks')
      console.log('\nUsage: npm run test-ai [command]')
  }
}

// Handle errors gracefully
main().catch((error) => {
  console.error('💥 Test runner failed:', error)
  process.exit(1)
})
