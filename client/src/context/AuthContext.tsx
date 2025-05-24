import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChange } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';

interface AuthContextType {
  firebaseUser: User | null;
  isFirebaseLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  isFirebaseLoading: true,
});

export const useFirebaseAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setFirebaseUser(user);
      setIsFirebaseLoading(false);
      
      if (user) {
        console.log('User logged in:', user.displayName || user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, isFirebaseLoading }}>
      {children}
    </AuthContext.Provider>
  );
};