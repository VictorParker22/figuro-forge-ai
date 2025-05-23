
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "./AuthProvider";
import { cleanupAuthState } from "@/utils/authUtils";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AuthForm() {
  const { signIn, signUp, signInWithGoogle, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setShowResendOption(false);
    
    // Clear any previous auth state
    cleanupAuthState();
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setErrorMessage(error);
      // If the error is about email verification, show resend option
      if (error.includes("verify your email")) {
        setShowResendOption(true);
      }
    } else {
      // Success - navigate to home
      navigate("/");
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
    // Clear any previous auth state
    cleanupAuthState();
    
    const { error } = await signUp(email, password);
    
    if (error) {
      setErrorMessage(error);
    }
    
    setIsLoading(false);
  };
  
  const handleResendVerification = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address");
      return;
    }
    
    setResendLoading(true);
    const { error } = await resendVerificationEmail(email);
    setResendLoading(false);
    
    if (!error) {
      setShowResendOption(false);
    }
  };

  return (
    <Tabs defaultValue="signin" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      
      <TabsContent value="signin">
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            {showResendOption && (
              <div className="p-3 bg-background/80 border border-border rounded-md">
                <p className="text-sm mb-2">Haven't received the verification email?</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </Button>
              </div>
            )}
            
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => signInWithGoogle()} 
              className="w-full"
              disabled={isLoading}
            >
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Sign up for a new account to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Input
                  id="email-signup"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="password-signup"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => signInWithGoogle()} 
              className="w-full"
              disabled={isLoading}
            >
              Sign up with Google
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
