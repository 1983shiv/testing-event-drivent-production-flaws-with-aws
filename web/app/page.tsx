"use client"

import { useState } from "react"
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if(email && password){
      // Demo Autho - in production, use AWS Cognitor or NextAuth
      localStorage.setItem("user", JSON.stringify({email}));
      router.push("/dashboard")
    } else {
      setError("Please enter email and password")
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">TalentBoard</h2>
        <p>Sign in to submit your application</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-md font-medium hover:bg-blue-700 transition-colors">Sign In</button>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Demo App - any email / password combination works
        </p>
      </form>
    </div>
  );
}
