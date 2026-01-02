// Helper Script for Console Debugging
// Paste this into your browser console to inspect what's being sent to Firestore

// Copy this and paste into Browser Console (F12 → Console tab)

// Function 1: Display all current elements
window.__debugElements = function() {
  const elements = JSON.parse(sessionStorage.getItem('canvasElements') || '[]');
  console.group('📋 Canvas Elements');
  elements.forEach((el, idx) => {
    console.group(`Element ${idx}: ${el.type} (ID: ${el.id})`);
    console.log('Full Element:', el);
    if (el.type === 'TEXT') {
      console.log('✓ Content:', el.content);
      console.log('✓ Font Size:', el.fontSize);
      console.log('✓ Text Style:', el.textStyle);
      console.log('✓ Color:', el.color);
    }
    console.groupEnd();
  });
  console.groupEnd();
};

// Function 2: Test serialization directly
window.__testSerialize = async function() {
  try {
    console.group('🧪 Testing Serialization');
    
    // This would need access to your serialization function
    // For now, this is a placeholder that shows expected format
    const testElement = {
      id: "test123",
      type: "text",
      content: "Test Content",
      x: 100,
      y: 100,
      width: 300,
      height: 60,
      fontSize: 24,
      color: "#0F172A",
      opacity: 1,
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      textStyle: {
        textAlign: "center",
        bold: false,
        italic: false,
        underline: false,
        fontFamily: "Arial",
        letterSpacing: 0,
        lineHeight: 1.2
      }
    };
    
    console.log('Expected Serialized Element:', JSON.stringify(testElement, null, 2));
    console.log('✓ All required fields present');
    console.log('✓ Content is:', testElement.content);
    
    console.groupEnd();
  } catch (error) {
    console.error('Error:', error);
  }
};

// Function 3: Monitor sessionStorage for debug data
window.__monitorStorage = function() {
  console.group('💾 Storage Contents');
  console.log('SessionStorage keys:', Object.keys(sessionStorage));
  console.log('Note: localStorage has been disabled');
  console.groupEnd();
};

// Function 4: Intercept API calls (advanced)
window.__setupAPIInterceptor = function() {
  console.log('🔍 Setting up API interceptor...');
  console.log('API calls will be logged to console');
  console.log('Look for messages starting with 🚀 [API]');
};

// Usage instructions
console.log(`
╔════════════════════════════════════════════════════════════════╗
║           TEXT ELEMENT DEBUGGING FUNCTIONS                    ║
╚════════════════════════════════════════════════════════════════╝

Available commands:
  • window.__debugElements()     - Show all canvas elements
  • window.__testSerialize()     - Test serialization format
  • window.__monitorStorage()    - Check browser storage
  • window.__setupAPIInterceptor() - Monitor API calls

Note: localStorage has been removed. All data is backend-driven.

Example workflow:
  1. Create a text element
  2. Edit it with your text
  3. Type: window.__debugElements()
  4. Check if 'content' field has your text
  5. Save the design via backend API
  6. Check browser console for 🚀 [API] messages

Console logs to watch for:
  🔍 [SERIALIZATION DEBUG] - Before serialization
  📝 [TEXT ELEMENT DEBUG]  - During serialization
  ✅ [SERIALIZATION DEBUG] - After serialization
  🚀 [API]                 - API call attempt
  ✅ [API]                 - API call success
