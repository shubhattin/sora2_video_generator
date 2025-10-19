import { client } from '~/api/client';

export const download_file_in_browser = (
  link: string,
  name: string,
  revoke_url_after_download = false
) => {
  const a = document.createElement('a');
  a.href = link;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (revoke_url_after_download) URL.revokeObjectURL(link);
};

export const download_video_file_in_browser = async (video_id: string, name: string) => {
  const req = await client.file.stream_file.$get({
    query: {
      video_job_id: video_id
    }
  });
  const blob = await req.blob();
  const blob_url = window.URL.createObjectURL(blob);
  download_file_in_browser(blob_url, name, true);
};
