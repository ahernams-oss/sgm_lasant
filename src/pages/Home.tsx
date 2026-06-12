import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] w-full flex items-center justify-center bg-background">
      {isLoading && (
        <Skeleton className="absolute max-w-full max-h-[calc(100vh-3rem)] aspect-video w-[90vw] rounded-xl" />
      )}
      <img
        src="/tela-inicial.jpg"
        alt="LASANT Construções — SGM"
        className={`max-w-full max-h-[calc(100vh-3rem)] object-contain select-none transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"}`}
        draggable={false}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default Home;
