# Market AI

Build a polished, modern frontend for an AI-powered e-commerce marketplace. The frontend should feel like a combination of a premium marketplace and a modern AI assistant — clean, trustworthy, intelligent, and easy to use.

Do NOT make it look like a generic admin dashboard. The primary experience is consumer-facing buying, selling, and negotiating.

1. DESIGN LANGUAGE

Create a consistent design system that will be used across every page.

Visual style

* Modern, minimal, premium marketplace aesthetic.

* Clean layouts with generous whitespace.

* Subtle borders and very soft shadows.

* Rounded cards and controls, generally 12–16px radius.

* Avoid excessive gradients, glassmorphism, neon effects, or overly decorative elements.

* Prioritize usability and information hierarchy.

* Use subtle animations and micro-interactions, but keep them fast and professional.

Color system

Use a mostly neutral interface:

* Background: warm/off-white or very light neutral gray.

* Primary text: near-black/deep charcoal.

* Secondary text: muted gray.

* Primary brand color: deep navy/indigo.

* Accent color: modern blue/indigo for interactive elements.

* Success: green.

* Warning/negotiation: amber.

* Error: red.

Use the accent color primarily for important actions, links, active states, and AI-related elements.

Typography

Use Inter or Geist throughout the application.

Typography hierarchy:

* Large, bold page headings.

* Medium-weight section headings.

* Highly readable body text.

* Prices should have strong visual hierarchy.

* Labels and metadata should be smaller and muted.

UI components

Create reusable components for:

* Buttons

* Inputs

* Select/dropdowns

* Product cards

* Seller badges

* Status badges

* Navigation

* Modal/dialog

* Toast notifications

* Chat/negotiation messages

* Price displays

* Loading states

* Empty states

* Error states

Primary buttons should be visually prominent but not oversized.

Use accessible contrast ratios, visible focus states, keyboard navigation, and semantic HTML.

⸻

2. GLOBAL NAVIGATION

Create a responsive navigation bar.

Desktop:

Logo | Marketplace | Categories | Search | Sell | [Notifications] [Profile]

The search bar should be prominent but compact.

The navigation should remain clean and uncluttered.

Mobile:

* Logo

* Search

* Profile/menu

* Use a mobile navigation pattern where appropriate.

The navigation should be reusable across all pages.

⸻

3. SIGN-UP PAGE

Create a polished registration page.

Desktop layout:

* Two-column layout.

* Left side contains tasteful marketplace/product imagery or a simple brand visual.

* Right side contains the registration form.

* On mobile, collapse into a single-column layout.

Form:

Create your account

“Join the marketplace and start buying, selling, and negotiating smarter.”

Fields:

* Full name

* Email address

* Password

* Confirm password

Include:

* Password visibility toggle.

* Password strength indicator.

* Terms and conditions checkbox.

* Primary “Create account” button.

* “Already have an account? Sign in” link.

Include appropriate validation states:

* Empty field

* Invalid email

* Password mismatch

* Weak password

* Successful submission

* Loading state

Do not overwhelm the user with unnecessary fields.

The signup experience should feel trustworthy and simple.

⸻

4. PRODUCT PAGE

Create a premium product-detail page.

Top:

Breadcrumb navigation:

Home / Category / Product

Main layout:

LEFT:

Large product image/gallery.

RIGHT:

* Product name

* Rating and review count

* Seller information

* Verification badge

* Current price

* Product availability

* Important product information

* Primary CTA: “Buy Now”

* Secondary CTA: “Negotiate”

The “Negotiate” action is an important feature and should be visually distinctive without overpowering “Buy Now”.

Example:

iPhone 15 Pro

★★★★★ 4.8 (124 reviews)

₦1,250,000

Seller:

TechStore

✓ Verified seller

[ Buy Now ] [ Negotiate ]

Below the main product section:

Product description

Detailed product information.

Specifications

Display specifications in a clean two-column table/list.

Seller information

Show:

* Seller name

* Verification status

* Rating

* Number of completed sales

* Response time

Reviews

Create a clean review section with ratings and individual reviews.

Similar products

Horizontal product-card carousel/grid.

Product cards should include:

* Product image

* Product name

* Price

* Rating

* Seller

* Negotiable badge where applicable

⸻

5. NEGOTIATION PAGE

This is a major differentiating feature of the application.

Design it as a modern negotiation workspace combining:

* Marketplace product information

* Chat interface

* Offer management

* AI assistance

Desktop layout:

LEFT / CENTER:

Negotiation conversation.

RIGHT:

Negotiation summary.

Header:

← Back to product

Negotiating:

[Product name]

Show a compact product preview containing:

* Product image

* Product name

* Seller

* Original price

Conversation

Create a conversational interface similar to modern messaging applications.

Messages should clearly distinguish:

BUYER

SELLER

AI ASSISTANT

Example:

Seller:

“The lowest I can do is ₦1,200,000.”

Buyer:

“Can you do ₦1,100,000?”

AI Assistant:

“You could try ₦1,150,000 based on the current negotiation.”

AI messages should have a subtle visual distinction, such as a small AI icon/badge and a lightly tinted background.

Do NOT make the AI visually dominate the conversation.

Offer cards

Whenever a user makes an offer, display it as a structured offer card.

Example:

Offer

₦1,150,000

Original price

₦1,250,000

Savings

₦100,000

Status: Pending

Actions:

[Accept] [Counter]

Clearly distinguish:

* Pending

* Accepted

* Rejected

* Countered

* Expired

Message composer

At the bottom:

[ Type your message or offer… ]

[Make Offer] [Send]

Allow the user to switch between:

* Normal message

* Price offer

The offer input should support currency formatting.

⸻

6. NEGOTIATION SUMMARY PANEL

Desktop right sidebar:

NEGOTIATION SUMMARY

Product

[thumbnail] Product name

Original price

₦1,250,000

Current offer

₦1,150,000

Potential savings

₦100,000

Seller

TechStore ✓

Status

● Negotiating

Actions:

[ Accept Offer ]

[ Counter Offer ]

The summary panel should remain visible while scrolling on desktop.

On mobile, convert it into a collapsible section or bottom sheet.

⸻

7. AI NEGOTIATION ASSISTANT

The application should clearly communicate that the AI can assist the buyer without pretending to be the seller.

Add a subtle “AI Assistant” indicator.

Possible actions:

* Suggest an offer

* Suggest a counteroffer

* Explain the current negotiation

* Recommend whether an offer is reasonable

* Help formulate a message

Example:

AI Assistant

“Based on the seller’s previous counteroffer, ₦1,150,000 may be a reasonable next offer.”

Provide buttons such as:

[Use suggestion]

[Make another offer]

Keep AI recommendations concise and unobtrusive.

⸻

8. RESPONSIVE DESIGN

The application must be fully responsive.

Desktop:

* Spacious two/three-column layouts where appropriate.

* Persistent navigation.

* Sticky negotiation summary.

Tablet:

* Reduce spacing.

* Adapt product layout.

Mobile:

* Single-column layouts.

* Bottom-sheet/modal patterns where appropriate.

* Large touch targets.

* Sticky bottom CTA on product pages:

    [Buy Now] [Negotiate]

The negotiation interface on mobile should feel like a native messaging application.

Do not simply shrink the desktop interface.

⸻

9. INTERACTIONS & STATES

Implement polished states for:

* Loading

* Skeleton loading

* Empty state

* Error state

* Success

* Disabled buttons

* Form validation

* Hover

* Focus

* Active

* Selected

* Pending negotiation

* Accepted offer

* Rejected offer

Use subtle animations:

* Button feedback

* Message appearance

* Offer status changes

* Page transitions

Avoid excessive animations.

⸻

10. DATA & BACKEND INTEGRATION

Build the frontend architecture so it can easily connect to an existing backend/API.

Do NOT invent a new backend architecture.

Use clean API/service abstraction so API endpoints can be connected later.

Keep:

* UI components

* API calls

* Types/interfaces

* State management

* Utility functions

properly separated.

The backend/database/schema will be connected separately, so use realistic mock data initially where necessary.

Do not hardcode data into reusable components.

⸻

11. CODE QUALITY

Use:

* Reusable components

* Clean component hierarchy

* Type-safe code

* Responsive CSS

* Accessible components

* Consistent spacing

* Consistent typography

* Consistent design tokens

Avoid:

* Duplicated components

* Random colors

* Inconsistent border radii

* Excessive shadows

* Huge empty areas

* Generic dashboard templates

* Unnecessary UI elements

The final product should feel like a real production e-commerce application rather than a prototype.

CORE EXPERIENCE

The three most important user journeys are:

1. Sign up → enter marketplace

2. Browse product → view product → buy or negotiate

3. Product → negotiate → make offer → receive counteroffer → accept/reject

Design the UI around these journeys.

The negotiation experience should be the application’s strongest differentiator.

Make the final interface visually cohesive across all pages and ensure that a user can immediately understand:

* What the product costs

* Who is selling it

* Whether the seller is trustworthy

* What the current negotiation status is

* What action they can take next

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nimble-deal-space.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91804e86-dba9-4b6e-ad24-d9040b610696).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
