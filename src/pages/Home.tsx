import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] w-full flex items-center justify-center bg-background">
      <img
        src="/tela-inicial.png"
        alt="LASANT Construções — SGM"
        className="max-w-full max-h-[calc(100vh-3rem)] object-contain select-none"
        draggable={false}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default Home;
