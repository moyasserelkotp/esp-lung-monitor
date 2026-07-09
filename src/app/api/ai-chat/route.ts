import { NextRequest, NextResponse } from "next/server";

// AI Chat API Route 
interface ChatRequest {
  message: string;
  sensorContext: {
    oxygen: number;
    pressure: number;
    breathingRate: number;
    pumpUsage: number;
    inhaleValve: string;
    exhaleValve: string;
    breathState: string;
  };
  history: { role: "user" | "assistant"; content: string }[];
}

// Rule-based AI responses when no API key is set
function ruleBasedResponse(message: string, ctx: ChatRequest["sensorContext"]): string {
  const msg = message.toLowerCase();

  if (msg.includes("oxygen") && msg.includes("drop")) {
    const rate = (21 - ctx.oxygen).toFixed(2);
    return `The oxygen drop of ${rate}% from the 21% baseline is caused by the iron oxidation reaction inside the acrylic chamber consuming O₂. Currently at ${ctx.oxygen}%, the system is ${ctx.oxygen > 19.5 ? "within normal operating range" : "approaching the lower threshold"}. To recover faster, consider increasing the inhale duration or valve open time to deliver more fresh ambient air per cycle.`;
  }

  if (msg.includes("pressure") && (msg.includes("oscillat") || msg.includes("unstable"))) {
    return `Pressure oscillation at ${ctx.pressure.toFixed(1)} cmH₂O typically indicates aggressive PID tuning. Recommended actions:\n• Reduce Kp by 15–20% to decrease proportional gain\n• Increase Kd slightly to add damping\n• Verify the pressure regulator (AR3000) is not chattering\nCurrent pump usage at ${ctx.pumpUsage}% suggests the loop is active.`;
  }

  if (msg.includes("pump") && (msg.includes("high") || msg.includes("increase"))) {
    return `Pump usage at ${ctx.pumpUsage}% is ${ctx.pumpUsage > 80 ? "elevated — this could indicate a pressure leak, clogged tubing, or a regulator set too high" : "within normal range"}. Check: 1) Teflon tape seals on all NPT fittings, 2) AR3000 regulator set pressure, 3) Tubing connections on the 8mm barb fittings.`;
  }

  if (msg.includes("pid") || msg.includes("tune") || msg.includes("tuning")) {
    return `For the SDP816 pressure sensor on your VN-C1 pump system, recommended starting PID values are:\n• Kp: 2.5 – 4.0\n• Ki: 0.3 – 0.8\n• Kd: 0.1 – 0.3\nWith pressure at ${ctx.pressure.toFixed(1)} cmH₂O and pump at ${ctx.pumpUsage}%, the current loop appears ${Math.abs(ctx.pressure - 18) < 1 ? "well-regulated" : "needs adjustment"}. Use the Ziegler–Nichols method for systematic tuning.`;
  }

  if (msg.includes("valve") || msg.includes("inhale") || msg.includes("exhale")) {
    return `Currently: Inhale valve is ${ctx.inhaleValve}, Exhale valve is ${ctx.exhaleValve}, system in ${ctx.breathState} phase.\nThe SNS 2W040-N10 (inhale) handles active pressure and should open 50–100ms before the pump starts. The Spartan 20HL69 (exhale) is a poppet design — ensure full pump stop before opening to avoid backpressure damage. Breathing at ${ctx.breathingRate} BPM.`;
  }

  if (msg.includes("predict") || msg.includes("how long") || msg.includes("forecast")) {
    const consumptionRate = 0.015; // % per second approximate
    const currentDeficit = 21 - ctx.oxygen;
    const timeToRecover = currentDeficit > 0 ? Math.round(currentDeficit / consumptionRate / 60) : 0;
    return `Based on current O₂ at ${ctx.oxygen}%, estimated consumption rate is ~0.9%/min from the iron oxidation. At current intake rate, O₂ recovery to 21% would take approximately ${timeToRecover} minutes. Oxygen is expected to reach ${(ctx.oxygen - 0.9 * 5).toFixed(1)}% in 5 minutes if no corrective action is taken.`;
  }

  if (msg.includes("performance") || msg.includes("status") || msg.includes("summary")) {
    const status = ctx.oxygen > 20 && ctx.pressure > 15 && ctx.pressure < 22 ? "Excellent" : ctx.oxygen > 19 ? "Good" : "Needs Attention";
    return `System Performance Summary:\n• O₂: ${ctx.oxygen}% (target 21%) — ${Math.abs(ctx.oxygen - 21) < 0.5 ? "✓ On target" : "⚠ Off target"}\n• Pressure: ${ctx.pressure.toFixed(1)} cmH₂O — ${ctx.pressure > 15 && ctx.pressure < 22 ? "✓ Normal" : "⚠ Check"}\n• Pump: ${ctx.pumpUsage}% — ${ctx.pumpUsage < 80 ? "✓ Efficient" : "⚠ High load"}\n• Breathing: ${ctx.breathingRate} BPM — Normal range 8–25\nOverall: ${status}`;
  }

  // Default contextual response
  return `Currently monitoring: O₂ at ${ctx.oxygen}%, pressure at ${ctx.pressure.toFixed(1)} cmH₂O, pump at ${ctx.pumpUsage}%, system in ${ctx.breathState} phase.\n\nYou can ask me about: oxygen drops, pressure oscillations, PID tuning, valve timing, pump performance, system predictions, or request a performance summary. What specific aspect would you like to analyze?`;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, sensorContext, history } = body;
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const systemPrompt = `You are an expert biomedical engineering AI assistant for a closed-loop ESP32-based artificial lung simulator. 
      
Current sensor readings:
- Oxygen: ${sensorContext.oxygen}% (target: 21%)
- Pressure: ${sensorContext.pressure} cmH₂O (target: 18 cmH₂O)
- Breathing Rate: ${sensorContext.breathingRate} BPM
- Pump Usage: ${sensorContext.pumpUsage}%
- Inhale Valve: ${sensorContext.inhaleValve}
- Exhale Valve: ${sensorContext.exhaleValve}
- Breath State: ${sensorContext.breathState}

Hardware: ESP32, VN-C1 diaphragm pump, SNS 2W040-N10 inhale valve, Spartan 20HL69 exhale valve, Sensirion SDP816 pressure sensor, DFRobot SEN0465 O2 sensor, AR3000 regulator.

Provide concise, technical, actionable responses. Use bullet points when listing steps. Focus on practical engineering solutions.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-6), // last 6 messages for context
            { role: "user", content: message },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "Unable to get AI response.";
      return NextResponse.json({ reply, source: "openai" });
    }

    // Rule-based fallback
    const reply = ruleBasedResponse(message, sensorContext);
    return NextResponse.json({ reply, source: "rule-based" });

  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { reply: "An error occurred. Please try again.", source: "error" },
      { status: 500 }
    );
  }
}
