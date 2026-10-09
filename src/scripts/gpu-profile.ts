/** GPU timers are opt-in diagnostics; queries are asynchronous and never stall rendering. */
export function createGpuProfile(context: WebGLRenderingContext | WebGL2RenderingContext, enabled: boolean, canvas: HTMLCanvasElement) {
 const gl=context as WebGL2RenderingContext;
 const ext = enabled && 'beginQuery' in gl ? gl.getExtension('EXT_disjoint_timer_query_webgl2') : null;
 let pending: WebGLQuery | null = null, active = false;
 let total = 0, count = 0;
 return {
  begin() {
   if(!ext)return;
   if(pending) {
    if(!gl.getQueryParameter(pending,gl.QUERY_RESULT_AVAILABLE))return;
    if(!gl.getParameter(ext.GPU_DISJOINT_EXT)) {total+=gl.getQueryParameter(pending,gl.QUERY_RESULT)/1e6;count++;if(count===30){canvas.dataset.gpuMs=(total/count).toFixed(2);total=0;count=0;}}
    gl.deleteQuery(pending);pending=null;
   }
   pending=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,pending);active=true;
  },
  end(){if(active){gl.endQuery(ext.TIME_ELAPSED_EXT);active=false;}},
  dispose(){if(pending)gl.deleteQuery(pending);pending=null;}
 };
}
