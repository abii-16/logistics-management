# KRISHIBUNDLE

## AI-Powered Cooperative Logistics Platform for Small Farmers

Version: 1.0 Final Hackathon Build
Target Event: ARCNIGHT 2026
Domain: AgriTech

---

# 1. PRODUCT VISION

KrishiBundle is a multilingual AI-powered agricultural logistics platform that helps farmers reduce transportation costs by automatically creating cooperative transport bundles.

The platform supports:

1. Non-literate farmers via voice calls
2. Smartphone farmers via web dashboard
3. Drivers via bidding marketplace
4. Admins via AI operations dashboard

The objective is to reduce transportation costs, improve truck utilization, reduce spoilage risk, and increase farmer profits.

---

# 2. CORE PROBLEM

Small farmers often:

* Cannot fill an entire truck
* Pay high transportation costs
* Have no visibility into logistics
* Depend on middlemen

Drivers often:

* Travel with partially empty vehicles
* Have no centralized load marketplace

KrishiBundle solves this through AI-driven cooperative logistics.

---

# 3. USER TYPES

## User Type A: Non-Educated Farmer

Primary Interface:

Voice Call System

Capabilities:

* Call toll-free number
* Speak in Tamil/Hindi/English
* Receive voice confirmation
* Receive SMS updates

---

## User Type B: Educated Farmer

Primary Interface:

Farmer Companion Dashboard

Capabilities:

* Register account
* Create booking
* Upload voice note
* Track orders
* View assigned driver
* View savings

---

## User Type C: Driver

Primary Interface:

Driver Dashboard

Capabilities:

* Register vehicle
* Submit legal information
* View transport opportunities
* Bid for loads
* Manage active deliveries

---

## User Type D: Admin

Primary Interface:

Operations Dashboard

Capabilities:

* Monitor all farmers
* Monitor all drivers
* View clustering engine
* View AI extraction
* Track savings metrics

---

# 4. SYSTEM ARCHITECTURE

Farmer Call
Farmer Dashboard
│
▼
Voice/Text Processing Layer
│
▼
AI Extraction Layer
│
▼
Hyperlocal Context Layer
│
▼
Confidence Scoring Layer
│
▼
Crop Compatibility Engine
│
▼
Spatial Clustering Engine
│
▼
Cooperative Bundle Generator
│
▼
Driver Marketplace
│
▼
Savings Calculator
│
▼
Notifications Engine

---

# 5. NON-LITERATE FARMER FLOW

Step 1

Farmer calls:

1800-KRISHI

IVR Menu:

Press 1 for Tamil

Press 2 for Hindi

Press 3 for English

---

Step 2

System Prompt:

Please tell:

* Village Name
* Crop Name
* Crop Weight

---

Step 3

Farmer Speaks

Example:

"I am Arumugam from Melma village. I have 400 kilograms of tomatoes."

---

Step 4

AI Processing

Audio
↓
Whisper
↓
Gemini
↓
JSON Extraction

Output:

{
"farmer_name":"Arumugam",
"village":"Melma",
"crop":"Tomato",
"weight":400
}

---

Step 5

Voice Confirmation

System says:

"Thank you. We recorded 400 kilograms of tomatoes from Melma village."

---

Step 6

SMS Confirmation

Example:

KrishiBundle Booking Confirmed

Crop: Tomato

Weight: 400kg

Village: Melma

Booking ID: KB1024

---

# 6. FARMER COMPANION DASHBOARD

## Registration

Fields:

Name

Phone Number

Village

Preferred Language

Role = Farmer

---

## Create Booking

Fields:

Crop Type

Weight

Location

Voice Upload

Submit

---

## My Orders

Statuses:

Pending

Cluster Forming

Driver Assigned

In Transit

Completed

---

## Assigned Driver

Displays:

Driver Name

Phone Number

Vehicle Number

Pickup Time

Transport Cost

---

## Savings Dashboard

Displays:

Individual Cost

Shared Cost

Total Savings

---

# 7. DRIVER DASHBOARD

## Registration

Fields:

Name

Phone Number

Vehicle Number

Vehicle Type

Driving License Number

Role = Driver

---

## Vehicle Types

Tata Ace

Mahindra Bolero Pickup

Ashok Leyland Dost

Mini Truck

Other

---

## Available Loads

Displays:

Pickup Village

Destination

Total Weight

Expected Earnings

Crop Types

---

## Bid Submission

Displays:

Suggested Price

Driver Bid

Submit Bid

---

## Active Trips

Displays:

Assigned Farmers

Pickup Status

Delivery Status

Buttons:

Picked Up

Delivered

---

# 8. ADMIN OPERATIONS DASHBOARD

Purpose:

Judge Demonstration Dashboard

---

SECTION A

AI Processing Monitor

Displays:

Transcript

Extracted Entities

Confidence Scores

---

SECTION B

AI Recommendation Card

Displays:

Number of Farmers

Total Weight

Truck Utilization

Estimated Savings

Spoilage Risk

Suggested Departure Time

---

SECTION C

Cluster Visualization

SVG Tactical Map

Displays:

Farmers

Clusters

Truck Route

Destination Mandi

---

SECTION D

Live Driver Bidding

Displays:

Driver Name

Vehicle

Bid Amount

Reliability Score

---

SECTION E

Savings Analytics

Displays:

Total Farmers Served

Total Savings Generated

Total Weight Transported

---

# 9. AI INNOVATIONS

## Hyperlocal Context Injection

Village dictionary is injected before LLM processing.

Purpose:

Improve extraction accuracy for rural locations.

---

## Confidence Scoring

Every extracted field gets confidence score.

Example:

Location:
Melma (92%)

Weight:
400kg (97%)

---

## Crop Compatibility Matrix

Prevent incompatible crop combinations.

Example:

Tomato + Onion

Rejected

---

## AI Recommendation Engine

Generates:

Optimal Bundle

Savings Estimate

Departure Recommendation

Spoilage Risk

---

# 10. SMS NOTIFICATION SYSTEM

SMS #1

Booking Confirmation

Contains:

Crop

Weight

Village

Booking ID

---

SMS #2

Bundle Formed

Contains:

Number of Farmers

Expected Savings

Pickup Date

---

SMS #3

Driver Assigned

Contains:

Driver Name

Driver Phone

Vehicle Number

Pickup Time

Final Cost

---

SMS #4

Trip Completed

Contains:

Amount Paid

Savings Achieved

Feedback Link

---

# 11. DATABASE TABLES

Users

Orders

Bundles

Drivers

Vehicles

Bids

Notifications

AI_Logs

Savings_Analytics

---

# 12. FREE TECH STACK

FRONTEND

Next.js 15

React

TypeScript

Tailwind CSS

Framer Motion

Lucide React

SVG Visualization

Recharts

---

BACKEND

FastAPI

Pydantic

Uvicorn

---

DATABASE

Supabase PostgreSQL

---

AI

Faster Whisper

Gemini Flash Free Tier

---

MACHINE LEARNING

NumPy

Scikit-Learn

DBSCAN Clustering

---

TTS

Browser SpeechSynthesis API

---

AUTH

Supabase Auth

---

DEPLOYMENT

Frontend → Vercel

Backend → Render

Database → Supabase

---

# 13. PROJECT STRUCTURE

frontend/

app/

components/

FarmerDashboard

DriverDashboard

AdminDashboard

VoiceUpload

AuctionPanel

SavingsPanel

RecommendationCard

TacticalMap

services/

hooks/

types/

backend/

routes/

services/

speech_service.py

extraction_service.py

context_service.py

clustering_service.py

compatibility_service.py

recommendation_service.py

notification_service.py

auction_service.py

models/

schemas/

database/

---

# 14. HACKATHON DEMO FLOW

1. Farmer calls and speaks Tamil.

2. AI extracts crop, village and weight.

3. Voice confirmation is generated.

4. SMS confirmation appears.

5. Admin dashboard shows new booking.

6. AI clusters nearby farmers.

7. Recommendation card generated.

8. Driver submits bid.

9. Winning driver selected.

10. Driver assigned to farmer.

11. Farmer dashboard updates.

12. Savings counter animates.

13. Final screen displays:

Farmers Served

Money Saved

Weight Transported

---

# FINAL PITCH

KrishiBundle enables both literate and non-literate farmers to access affordable transportation through voice calls, AI-powered logistics optimization, cooperative bundling, and driver marketplaces, reducing transportation costs while increasing farmer profits.
