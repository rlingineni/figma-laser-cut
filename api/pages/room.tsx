/** @jsxImportSource npm:react@^18 */
/// <reference types="npm:@types/react@^18" />
import { renderToStaticMarkup } from "react-dom/server";
import type { FileEntry } from "../storage.ts";

function ImgIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" strokeWidth="1.2" stroke="#555">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#f0f0f0" stroke="#bbb" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="#bbb" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l5-5 4 4 3-3 6 6" />
    </svg>
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

function FileRow({ file, first }: { file: FileEntry; first: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 min-h-[64px] bg-white  mx-1.5 my-1.5 ${!first ? "border-t border-gray-200" : "rounded-xl"}`}>
      <div className="flex items-center gap-3 overflow-hidden">
        <ImgIcon />
        <span className="text-sm italic truncate">{file.filename}</span>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {/* data-url wired to printFile by inline script */}
        <button type="button" className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer" data-url={file.url} title="Print">
          <PrintIcon />
        </button>
        <a className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-600" href={file.url} download={file.filename} title="Download">
          <DownloadIcon />
        </a>
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
                  {files.map((f, i) => <FileRow key={f.filename} file={f} first={i === 0} />)}
                  {Array.from({ length: emptyCount }).map((_, i) => (
                    <div key={i} className="min-h-[64px] bg-gray-100 border-b border-gray-200 last:border-b-0" />
                  ))}
                </>
            }
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelectorAll('button[data-url]').forEach(function(btn) {
            btn.onclick = function() {
              fetch(btn.dataset.url)
                .then(function(r) { return r.text(); })
                .then(function(svg) {
                  var blob = new Blob(
                    ['<!DOCTYPE html><html><body style="margin:0">' + svg + '</body></html>'],
                    { type: 'text/html' }
                  );
                  var url = URL.createObjectURL(blob);
                  var w = window.open(url);
                  w.onload = function() { w.print(); URL.revokeObjectURL(url); };
                });
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
