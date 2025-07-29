// Cursor agent post-command hook
// Helps prevent hanging tool calls by ensuring clean exit signals

module.exports = async ({ command, exitCode, output }) => {
  // Log command completion
  console.log(`\n[Cursor Hook] Command completed: "${command}"`);
  console.log(`[Cursor Hook] Exit code: ${exitCode}`);
  
  // Force clean exit signal for Cursor
  if (exitCode === 0) {
    console.log("__CURSOR_SUCCESS__");
  } else {
    console.log("__CURSOR_FAILURE__");
  }
  
  // Add small delay to ensure output is flushed
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { handled: true };
}; 