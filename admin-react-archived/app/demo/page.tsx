'use client';

import {
  MinimalTextSwitcher,
  ButtonStyleSwitcher,
  FlagIconsSwitcher,
  DropdownSwitcher,
  ToggleSwitcher,
  AnimatedUnderlineSwitcher
} from '@/components/LanguageSwitcher';

export default function LanguageSwitcherDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Language Switcher Options</h1>
        <p className="text-gray-600 mb-12">Choose your preferred language switcher design. All options follow the Normand PLLC design system.</p>

        <div className="space-y-12">
          {/* Option 1: Minimal Text */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">Option 1: Minimal Text Switcher</h2>
            <div className="bg-gray-100 p-6 rounded-lg mb-4 flex items-center justify-between">
              <div className="text-lg font-medium">Logo / Header Area</div>
              <MinimalTextSwitcher />
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <p><strong>Features:</strong> Clean, minimal text-based switcher with separator. Active language highlighted in orange. Perfect for clean, professional look.</p>
            </div>
          </div>

          {/* Option 2: Button Style */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">Option 2: Button Style Switcher</h2>
            <div className="bg-gray-100 p-6 rounded-lg mb-4 flex items-center justify-between">
              <div className="text-lg font-medium">Logo / Header Area</div>
              <ButtonStyleSwitcher />
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <p><strong>Features:</strong> Toggle button style with background highlight. Active state uses black background. Hover shows orange.</p>
            </div>
          </div>

          {/* Option 3: Flag Icons */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">Option 3: Flag Icons Switcher</h2>
            <div className="bg-gray-100 p-6 rounded-lg mb-4 flex items-center justify-between">
              <div className="text-lg font-medium">Logo / Header Area</div>
              <FlagIconsSwitcher />
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <p><strong>Features:</strong> Visual flag representations. Active flag has orange border and slight scale. Good for international appeal.</p>
            </div>
          </div>

          {/* Option 4: Dropdown */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">Option 4: Dropdown Switcher</h2>
            <div className="bg-gray-100 p-6 rounded-lg mb-4 flex items-center justify-between">
              <div className="text-lg font-medium">Logo / Header Area</div>
              <DropdownSwitcher />
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <p><strong>Features:</strong> Compact dropdown selector. Saves space, good for multiple languages in future. Styled with brand colors.</p>
            </div>
          </div>

          {/* Option 5: Toggle Switch */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">Option 5: Toggle Switch</h2>
            <div className="bg-gray-100 p-6 rounded-lg mb-4 flex items-center justify-between">
              <div className="text-lg font-medium">Logo / Header Area</div>
              <ToggleSwitcher />
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <p><strong>Features:</strong> Modern toggle switch. Clear binary choice. Orange background when Hebrew selected.</p>
            </div>
          </div>

          {/* Option 6: Animated Underline */}
          <div className="bg-white rounded-lg border p-8">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">Option 6: Animated Underline</h2>
            <div className="bg-gray-100 p-6 rounded-lg mb-4 flex items-center justify-between">
              <div className="text-lg font-medium">Logo / Header Area</div>
              <AnimatedUnderlineSwitcher />
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <p><strong>Features:</strong> Elegant underline animation on hover and active state. Matches navigation menu style. Professional and refined.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">How to Use</h3>
          <p className="text-blue-800 mb-4">To use one of these language switchers in your admin panel:</p>
          <ol className="list-decimal list-inside text-blue-800 space-y-2">
            <li>Choose your preferred option from above</li>
            <li>Open <code className="bg-blue-100 px-2 py-1 rounded">admin-react/components/LanguageSwitcher.tsx</code></li>
            <li>Change the default export at the bottom to your preferred option</li>
            <li>Example: <code className="bg-blue-100 px-2 py-1 rounded">const LanguageSwitcher = ButtonStyleSwitcher;</code></li>
            <li>The admin panel will automatically use your selected design</li>
          </ol>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            ← Back to Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}