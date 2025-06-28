export type DVUser = {
  image: string;        
  email: string;        
  full_name: string;    
  id: string;           
  name: string;         
  tier: "EDUCATION" | "INDIE" | "PROFESSIONAL" | "ENTERPRISE" | "UNKNOWN";
};