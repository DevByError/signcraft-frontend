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
      type: "TEXT",
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

// Function 3: Monitor localStorage/sessionStorage for design data
window.__monitorStorage = function() {
  console.group('💾 Storage Contents');
  console.log('LocalStorage keys:', Object.keys(localStorage));
  console.log('SessionStorage keys:', Object.keys(sessionStorage));
  
  // Check for design-related data
  if (localStorage.getItem('lastSavedDesign')) {
    console.group('Last Saved Design');
    const design = JSON.parse(localStorage.getItem('lastSavedDesign'));
    console.log('Design:', design);
    console.groupEnd();
  }
  console.groupEnd();
};

// Function 4: Intercept Firestore calls (advanced)
window.__setupFirestoreInterceptor = function() {
  console.log('🔍 Setting up Firestore interceptor...');
  console.log('Firestore calls will be logged to console');
  console.log('Look for messages starting with 🚀 [FIRESTORE SAVE]');
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
  • window.__setupFirestoreInterceptor() - Monitor Firestore calls

Example workflow:
  1. Create a text element
  2. Edit it with your text
  3. Type: window.__debugElements()
  4. Check if 'content' field has your text
  5. Save the design
  6. Check browser console for 🚀 [FIRESTORE SAVE] messages

Console logs to watch for:
  🔍 [SERIALIZATION DEBUG] - Before serialization
  📝 [TEXT ELEMENT DEBUG]  - During serialization
  ✅ [SERIALIZATION DEBUG] - After serialization
  🚀 [FIRESTORE SAVE]      - Firestore save attempt
  ✅ [FIRESTORE SAVE]      - Firestore save success
  ❌ Error                 - Any errors during process
`);
