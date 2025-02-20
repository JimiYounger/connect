export interface VimeoVideo {
    uri: string;
    name: string;
    description: string;
    link: string;
    duration: number;
    width: number;
    height: number;
    created_time: string;
    modified_time: string;
    pictures: {
      base_link: string;
      sizes: Array<{
        width: number;
        height: number;
        link: string;
      }>;
    };
  }
  
  export interface VimeoResponse {
    data: VimeoVideo[];
    total: number;
    page: number;
    per_page: number;
  }