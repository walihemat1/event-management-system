import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-peach-50 p-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-md p-6">
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-semibold mb-2">Welcome Back!!</h1>
          </motion.div>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="email@gmail.com"
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                placeholder="Enter your password"
                className="pl-10"
              />
            </div>
            <div className="text-right text-sm text-gray-500 cursor-pointer">
              Forgot Password?
            </div>
            <Button className="w-full bg-peach-200 hover:bg-peach-300 text-brown-800 rounded-xl py-6 text-lg">
              Login
            </Button>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="mx-2 text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <div className="flex justify-center gap-4 text-xl">
              <span>🟦</span>
              <span>🟥</span>
              <span>🍎</span>
            </div>

            <div className="text-center text-sm">
              Don’t have an account?{" "}
              <span className="text-peach-400 cursor-pointer">Sign up</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
