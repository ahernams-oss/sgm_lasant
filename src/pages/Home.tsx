const Home = () => {
  return (
    <div className="min-h-[calc(100vh-3rem)] w-full flex items-center justify-center bg-background">
      <img
        src="/tela-inicial.png"
        alt="LASANT Construções — SGM"
        className="max-w-full max-h-[calc(100vh-3rem)] object-contain select-none"
        draggable={false}
      />
    </div>
  );
};

export default Home;
