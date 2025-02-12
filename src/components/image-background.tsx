export const ImageBackground = ({ imgSrc }: { imgSrc: string | undefined }) => {
  if (!imgSrc) {
    return null;
  }

  return (
    <div class="absolute opacity-20 w-full top-0 bottom-0 z-0 filter saturate-[7] overflow-hidden h-full">
      {[...new Array(10)].map((_, index) => (
        <div
          key={`logo-bg-${index}`}
          class="absolute inset-0 w-full h-full bg-contain bg-center filter blur-3xl scale-200"
          style={`background-image: url(${imgSrc});`}
        >
          {index}
        </div>
      ))}
    </div>
  );
};
