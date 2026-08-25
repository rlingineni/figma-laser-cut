/** @jsxImportSource npm:react@^18 */
/// <reference types="npm:@types/react@^18" />
import { renderToStaticMarkup } from "react-dom/server";
import type { FileEntry } from "../storage.ts";

function ImgIcon({ url }: { url: string }) {
  return (
    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
      <img src={url} className="w-full h-full object-contain p-1" alt="" />
    </div>
  );
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-6 0h.008v.008H12V10.5Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function FileRow({ file }: { file: FileEntry }) {
  return (
    <div className="file-row-item flex items-center justify-between px-3 py-2.5 min-h-[64px] bg-white mx-1.5 my-1.5 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-gray-200">
      <div className="flex items-center gap-3 overflow-hidden">
        <ImgIcon url={file.url} />
        <span className="text-sm italic truncate">{file.filename}</span>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {/* data-url wired to printFile / deleteFile by inline script */}
        <div className="relative group">
          <button type="button" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer" data-url={file.url}>
            <PrintIcon />
          </button>
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">Print</span>
        </div>
        <div className="relative group">
          <a className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-600" href={file.url} download={file.filename}>
            <DownloadIcon />
          </a>
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">Download</span>
        </div>
        <div className="relative group">
          <button type="button" className="flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer" data-delete-url={file.url}>
            <TrashIcon />
          </button>
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">Delete</span>
        </div>
      </div>
    </div>
  );
}

function RoomPage({ roomId, files }: { roomId: string; files: FileEntry[] }) {
  const emptyCount = Math.max(0, 5 - files.length);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`FigCuts — ${roomId}`}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-white text-gray-900 p-10 scale-110">
        <div className="max-w-lg mx-auto ">
          <div className="flex justify-between items-baseline mb-1">
            <h1 className="text-2xl font-bold italic">FigCuts</h1>
            <span className="text-sm font-semibold">{roomId}</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">files will be deleted in 24 hours</p>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {files.length === 0 && emptyCount === 5
              ? <p className="text-center text-gray-400 text-sm py-8">No files uploaded yet</p>
              : <>
                  {files.map((f) => <FileRow key={f.filename} file={f} />)}
                  {Array.from({ length: emptyCount }).map((_, i) => (
                    <div key={i} className="min-h-[64px] bg-gray-100 border-b border-gray-200 last:border-b-0" />
                  ))}
                </>
            }
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelectorAll('button[data-delete-url]').forEach(function(btn) {
            btn.onclick = function() {
              var url = btn.dataset.deleteUrl;
              fetch(url, { method: 'DELETE' }).then(function() {
                btn.closest('.file-row-item').remove();
              });
            };
          });
          document.querySelectorAll('button[data-url]').forEach(function(btn) {
            btn.onclick = function() {
              var svgUrl = btn.dataset.url;
              var iframe = document.createElement('iframe');
              iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
              document.body.appendChild(iframe);
              var doc = iframe.contentDocument || iframe.contentWindow.document;
              doc.open();
              doc.write('<!DOCTYPE html><html><head><style>@page{margin:0}body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="' + svgUrl + '" onload="window.print()"></body></html>');
              doc.close();
              setTimeout(function() { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 4000);
            };
          });
        `}} />
      </body>
    </html>
  );
}

export function roomPage(roomId: string, files: FileEntry[]): string {
  return "<!DOCTYPE html>" + renderToStaticMarkup(<RoomPage roomId={roomId} files={files} />);
}
