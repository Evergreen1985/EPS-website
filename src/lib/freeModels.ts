export const FREE_MODELS = [
  { id:"llama-3.3-70b-versatile", provider:"groq",   name:"Llama 3.3 70B",    badge:"Best Quality", icon:"🦙", setupUrl:"https://console.groq.com" },
  { id:"llama-3.1-8b-instant",    provider:"groq",   name:"Llama 3.1 8B",     badge:"Fastest",      icon:"⚡", setupUrl:"https://console.groq.com" },
  { id:"mixtral-8x7b-32768",      provider:"groq",   name:"Mixtral 8x7B",     badge:"Long Context", icon:"🔀", setupUrl:"https://console.groq.com" },
  { id:"gemma2-9b-it",            provider:"groq",   name:"Gemma 2 9B",       badge:"Google Open",  icon:"💎", setupUrl:"https://console.groq.com" },
  { id:"gemini-1.5-flash",        provider:"gemini", name:"Gemini 1.5 Flash", badge:"Google AI",    icon:"✨", setupUrl:"https://aistudio.google.com/app/apikey" },
  { id:"gemini-2.0-flash-lite",   provider:"gemini", name:"Gemini 2.0 Flash", badge:"Newest",       icon:"🚀", setupUrl:"https://aistudio.google.com/app/apikey" },
] as const;

export type FreeModel = typeof FREE_MODELS[number];
