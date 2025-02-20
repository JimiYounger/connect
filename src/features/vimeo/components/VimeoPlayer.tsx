interface VimeoPlayerProps {
    videoId: string;
    width?: string | number;
    height?: string | number;
  }
  
  export const VimeoPlayer = ({ videoId, width = '100%', height = '360' }: VimeoPlayerProps) => {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${videoId}`}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen
      />
    );
  };