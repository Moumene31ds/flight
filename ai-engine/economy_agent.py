import asyncio
import os
import json
import random
from datetime import datetime

try:
    from google.antigravity import Agent, LocalAgentConfig
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

# Global state trackers for the economy
fuel_price = 78.50
co2_tax_rate = 40.00
demand_factor = 1.05

SYSTEM_INSTRUCTIONS = """
You are the Macro-Economy & Strategy Agent for a real-time Airline Management Simulation game.
Your task is twofold:
1. Generate realistic global events affecting aviation (oil production changes, holidays, weather anomalies, carbon tax changes, volcanic eruptions).
2. Advise autonomous NPC competitor airlines (e.g. Apex Airways, GlobalJet, Skylink Express) on their tactical decisions (buy planes, lease planes, establish routes).

You must always output valid JSON objects matching the structures requested.
"""

def init_firebase():
    """Initializes Firebase Admin SDK using cert, environment variable or falls back to simulated mode."""
    if not FIREBASE_AVAILABLE:
        print("Firebase Admin SDK is not installed. Running in standalone local simulation.")
        return None

    # Check for service account JSON in the local directory
    cert_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
    if os.path.exists(cert_path):
        print(f"Initializing Firebase with certificate: {cert_path}")
        cred = credentials.Certificate(cert_path)
        firebase_admin.initialize_app(cred)
        return firestore.client()
    elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("Initializing Firebase with default application credentials")
        firebase_admin.initialize_app()
        return firestore.client()
    else:
        print("\n" + "="*80)
        print("INFO: Firebase serviceAccountKey.json not found in 'ai-engine/'.")
        print("Running in simulated output mode. Updates will be printed to console.")
        print("To sync to Firestore, place your Firebase credentials JSON in this directory.")
        print("="*80 + "\n")
        return None

async def run_economy_cycle(agent, db):
    """Generates a macro-economic event using the AI Agent and updates the economy parameters."""
    global fuel_price, co2_tax_rate, demand_factor

    print("\n--- Generating Macro-Economic Event ---")

    event_data = None
    if SDK_AVAILABLE and agent:
        try:
            prompt = (
                "Generate a new global economic or weather event affecting the aviation industry.\n"
                "Return ONLY a raw JSON block. No markdown, no triple backticks, no explanatory text.\n"
                "JSON format:\n"
                "{\n"
                '  "title": "Title of event",\n'
                '  "description": "Brief description of the event",\n'
                '  "impact_type": "fuel" | "co2" | "demand" | "general",\n'
                '  "fuel_modifier": 1.0, // multiplier between 0.80 and 1.30\n'
                '  "co2_modifier": 1.0,  // multiplier between 0.90 and 1.25\n'
                '  "demand_modifier": 1.0 // multiplier between 0.75 and 1.25\n'
                "}"
            )
            chat_response = await agent.chat(prompt)
            text_response = await chat_response.text()
            
            # Clean possible markdown wrap from output
            clean_text = text_response.strip().replace("```json", "").replace("```", "").strip()
            event_data = json.loads(clean_text)
            print(f"AI Agent response parsed successfully: {event_data['title']}")
        except Exception as e:
            print(f"Failed to generate event with Antigravity Agent: {e}. Falling back to random simulation.")

    # Fallback to local simulation if SDK failed or is not available
    if not event_data:
        fallbacks = [
            {
                "title": "Summer Holiday Travel Spike",
                "description": "High seasonal demand leads to busy routes worldwide.",
                "impact_type": "demand",
                "fuel_modifier": 1.02,
                "co2_modifier": 1.0,
                "demand_modifier": 1.20
            },
            {
                "title": "Refinery Outage in Middle East",
                "description": "A sudden refinery closure sparks oil supply worries.",
                "impact_type": "fuel",
                "fuel_modifier": 1.22,
                "co2_modifier": 1.0,
                "demand_modifier": 0.95
            },
            {
                "title": "Strict Global Accord on Aviation Carbon",
                "description": "Environmental coalition raises prices of carbon quotas.",
                "impact_type": "co2",
                "fuel_modifier": 1.0,
                "co2_modifier": 1.25,
                "demand_modifier": 0.92
            }
        ]
        event_data = random.choice(fallbacks)
        print("Using simulated event.")

    # Apply modifiers to global variables
    fuel_price = max(40.0, min(140.0, fuel_price * event_data.get("fuel_modifier", 1.0)))
    co2_tax_rate = max(15.0, min(90.0, co2_tax_rate * event_data.get("co2_modifier", 1.0)))
    demand_factor = max(0.5, min(2.0, demand_factor * event_data.get("demand_modifier", 1.0)))

    economy_update = {
        "fuelPrice": round(fuel_price, 2),
        "co2TaxRate": round(co2_tax_rate, 2),
        "demandFactor": round(demand_factor, 2),
        "event": {
            "id": f"event_{int(datetime.now().timestamp())}",
            "title": event_data["title"],
            "description": event_data["description"],
            "impactType": event_data["impact_type"],
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }
    }

    print(f"Update: Fuel = ${economy_update['fuelPrice']}/bbl, CO2 = ${economy_update['co2TaxRate']}/ton, Demand = {int(demand_factor*100)}%")
    print(f"Headline: {event_data['title']} - {event_data['description']}")

    # Write updates to Firestore if available
    if db:
        try:
            # Sync economy values
            db.collection("game").document("economy").set({
                "fuelPrice": economy_update["fuelPrice"],
                "co2TaxRate": economy_update["co2TaxRate"],
                "demandFactor": economy_update["demandFactor"]
            }, merge=True)
            
            # Append new event
            db.collection("events").add(economy_update["event"])
            print("Successfully synced economy state to Firestore.")
        except Exception as e:
            print(f"Error writing updates to Firestore: {e}")

async def run_npc_cycle(agent, db):
    """Simulates NPC autonomous decisions using the AI Agent and logs them."""
    if not SDK_AVAILABLE or not agent:
        # Fallback simulated NPC choices
        npc = random.choice(["Apex Airways", "GlobalJet", "Skylink Express"])
        action = random.choice(["Bought Boeing 737", "Leased Airbus A320", "Opened Route JFK-LHR", "Serviced Fleet"])
        print(f"NPC Event: {npc} executed: {action}")
        return

    print("\n--- Simulating NPC Competitor Actions ---")
    npc_name = random.choice(["Apex Airways", "GlobalJet", "Skylink Express"])
    
    try:
        prompt = (
            f"Given the current market values:\n"
            f"- Fuel: ${fuel_price:.2f}/barrel\n"
            f"- CO2 Tax: ${co2_tax_rate:.2f}/ton\n"
            f"- Passenger Demand Index: {demand_factor:.2f}\n\n"
            f"Select a strategic game move for NPC competitor airline '{npc_name}'.\n"
            "Return ONLY a raw JSON block.\n"
            "JSON format:\n"
            "{\n"
            '  "airline": "' + npc_name + '",\n'
            '  "action": "BUY_PLANE" | "LEASE_PLANE" | "ESTABLISH_ROUTE" | "MAINTENANCE",\n'
            '  "details": "e.g., Leased Airbus A320 for European Hubs or Opened LHR-DXB route",\n'
            '  "rationale": "Brief strategic reasoning based on fuel/tax rates"\n'
            "}"
        )
        chat_response = await agent.chat(prompt)
        text_response = await chat_response.text()
        clean_text = text_response.strip().replace("```json", "").replace("```", "").strip()
        decision = json.loads(clean_text)
        
        print(f"NPC [{decision['airline']}] decided to: {decision['action']}")
        print(f"Details: {decision['details']}")
        print(f"Rationale: {decision['rationale']}")

        if db:
            db.collection("competitor_logs").add({
                "airline": decision["airline"],
                "action": decision["action"],
                "details": decision["details"],
                "rationale": decision["rationale"],
                "timestamp": firestore.SERVER_TIMESTAMP
            })
    except Exception as e:
        print(f"NPC strategy execution failed: {e}")

async def main():
    db = init_firebase()
    agent = None

    if SDK_AVAILABLE:
        print("Google Antigravity SDK loaded. Preparing Agent configurations...")
        config = LocalAgentConfig(
            system_instructions=SYSTEM_INSTRUCTIONS
        )
        # We start the agent harness session
        async with Agent(config) as agent_session:
            agent = agent_session
            print("AI Engine Agent successfully initialized.")
            
            # Core execution loop
            while True:
                await run_economy_cycle(agent, db)
                await asyncio.sleep(5)  # Let other tasks slip
                await run_npc_cycle(agent, db)
                print("\nSleeping for 3 minutes before next market tick...")
                await asyncio.sleep(180)
    else:
        print("Starting simulated loop without Google Antigravity SDK...")
        while True:
            await run_economy_cycle(None, db)
            await asyncio.sleep(5)
            await run_npc_cycle(None, db)
            print("\nSleeping for 3 minutes before next market tick...")
            await asyncio.sleep(180)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nAI Economy service stopped.")
