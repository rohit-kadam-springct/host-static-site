(function () {
  console.log("Livesell integrated scripted Loaded")
  const script = document.currentScript

  const attributes = {
    meetingURL : script.getAttribute("data-livesell-url"),
    keepProductVisible: script.getAttribute("data-keep-product-visible") === "true" ? true : false
  }

  console.log(attributes)

  if(!attributes.meetingURL) {
    console.error("ERROR: Please provide meeting URL in livesell integration script.")
    return
  }

  // Add your meeting link here
  const MEETING_URL = attributes.meetingURL
  const LIVESELL_MEETING_ORIGIN = new URL(MEETING_URL).origin

  // Create the outer div
  const outerDiv = document.createElement('div');
  outerDiv.style.position = 'relative';

  // Create livesell-transparent-overlay div
  const transparentOverlayDiv = document.createElement('div');
  transparentOverlayDiv.id = 'livesell-transparent-overlay';
  outerDiv.appendChild(transparentOverlayDiv);

  // Create livesell-meeting-modal div
  const meetingModalDiv = document.createElement('div');
  meetingModalDiv.id = 'livesell-meeting-modal';

  // Create livesell-meeting-iframe iframe
  const meetingIframe = document.createElement('iframe');
  meetingIframe.id = 'livesell-meeting-iframe';
  meetingIframe.setAttribute('allow', 'camera; microphone; fullscreen');
  meetingIframe.frameBorder = "0"
  meetingModalDiv.appendChild(meetingIframe);


  // Create livesell-draggable-overlay div
  const draggableOverlayDiv = document.createElement('div');
  draggableOverlayDiv.id = 'livesell-draggable-overlay';
  meetingModalDiv.appendChild(draggableOverlayDiv);

  // Create livesell-resizable-overlay div
  const resizableOverlayDiv = document.createElement('div');
  resizableOverlayDiv.id = 'livesell-resizable-overlay';
  meetingModalDiv.appendChild(resizableOverlayDiv);

  outerDiv.appendChild(meetingModalDiv);

  // Create livesell-product-modal div
  const productModalDiv = document.createElement('div');
  productModalDiv.id = 'livesell-product-modal';
  outerDiv.appendChild(productModalDiv);

  // Create livesell-product-iframe iframe
  const productIframe = document.createElement('iframe');
  productIframe.id = 'livesell-product-iframe';
  productIframe.style.width = '100%';
  productIframe.style.height = '100%';
  productIframe.style.border = 'none';
  productIframe.style.overflow = 'hidden';
  productIframe.setAttribute('allowfullscreen', '');
  productIframe.setAttribute('allow', '');
  productIframe.frameBorder = "0"
  productModalDiv.appendChild(productIframe); 


  // Append the outer div to the document body
  document.body.appendChild(outerDiv);

  // Create a style element and add CSS rules
  const style = document.createElement('style');
  style.innerHTML = `
  #livesell-meeting-modal {
  position: fixed;
  z-index: 2147483646;
  height: 100%;
  width: 100vw;
  bottom: 0px;
  left: 0px;
  display: none;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  will-change: transform;
}

.livesell-floating-modal {
  left: 10px;
  bottom: 10px;
  border-radius: 6px !important;
  overflow: hidden !important;
}

#livesell-meeting-iframe {
  position: relative;
  z-index: 2147483645;
  border-radius: 6px;
  overflow: hidden;
  height: calc(100% - 32px);
  width: calc(100% - 32px);
}

#livesell-draggable-overlay {
  position: absolute;
  z-index: 2147483647;
  height: 100%;
  width: calc(100% - 110px);
  display: none;
  cursor: move;
}

#livesell-resizable-overlay {
  position: absolute;
  z-index: 2147483647;
  height: 48px;
  width: 48px;
  right: 0;
  top: 0;
  display: none;
  cursor: nesw-resize;
}

#livesell-transparent-overlay {
  position: fixed;
  z-index: 2147483647;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
  display: none;
  cursor: nesw-resize;
}

#livesell-product-modal {
  position: fixed;
  z-index: 1000000000;
  height: 100%;
  width: 100vw;
  top: 0px;
  left: 0px;
  display: none;
  overscroll-behavior: none;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
}
  `;

  // Append the style element to the document head
  document.head.appendChild(style);



  // const meetingIframe = window.document.getElementById("livesell-meeting-iframe");
  const meetingModal = window.document.getElementById('livesell-meeting-modal');
  const draggableOverlay = window.document.getElementById('livesell-draggable-overlay')
  const resizeOverlay = window.document.getElementById('livesell-resizable-overlay')
  const transparentOverlay = window.document.getElementById("livesell-transparent-overlay")
  const isSmallDevice = window.matchMedia("only screen and (max-width: 760px)").matches;

  const floatingWindowSize = isSmallDevice ? {
    // for small device
    minWidth: 160,
    minHeight: 90,
    width: 240,
    height: 135,
    maxWidth: 320,
    maxHeight:180
  } : {
    // for large device
    minWidth: 240,
    minHeight: 135,
    width: 320,
    height: 180,
    maxWidth: 640,
    maxHeight:360
  }

  // Event listener to receive messages from the livesell meeting iframe
  const eventListener = window.addEventListener('message', (event) => {

    if (event.origin !== LIVESELL_MEETING_ORIGIN) return
    const data = event.data

    switch (data.actionType) {
      case 'LIVESELL_DRAG_START':
        handleStartDrag(data.mouseX, data.mouseY)
        break
      case 'LIVESELL_DRAG_MOUSEMOVE':
        handleFrameMousemove(data.offsetX, data.offsetY)
        break
      case 'LIVESELL_DRAG_END':
        handleDragEnd()
        break
      case 'PRODUCT_PAGE':
        handleProductPage(data)
        break
    }

    if (event.data.fullscreen) {
      meetingIframe.src = `${MEETING_URL}?autoJoin=true&userName=${event.data.userName}`
      meetingModal.style.display = "flex"
      document.body.style.overflow = "hidden"
    }
    else if (event.data.fullscreen === false) {
      document.body.style.overflow = null // UPDATE TO: Parent site overlay property
      meetingModal.style.display = "none"
      meetingIframe.src = ""
    }
  });

  function handleProductPage(data) {
    const productModalEle = window.document.getElementById('livesell-product-modal');
    const productIframe = window.document.getElementById("livesell-product-iframe");

    if (data.action === "OPEN") {
      meetingIframe.contentWindow.postMessage({ data: "server", code: data.code }, LIVESELL_MEETING_ORIGIN)
      productIframe.src = data.url
      productModalEle.style.display = "flex"
      meetingModal.classList.add("livesell-floating-modal")

      meetingModal.style.width =  `${floatingWindowSize.width}px`;
      meetingModal.style.height=  `${floatingWindowSize.height}px`;
      meetingIframe.style.width = "100%"
      meetingIframe.style.height = "100%"
      meetingModal.style.bottom = '10px'
      meetingModal.style.left = '10px'

      if (data.options && data.options.addDraggableOverlay) {
        // add draggable Overlay
        showDraggableOverlay()
      }
      addParentResizeListener()
      showResizeOverlay()

    }
    else {
      if(!attributes.keepProductVisible) {
        productModalEle.style.display = "none"
        productIframe.src = ""
      }

      meetingModal.classList.remove("livesell-floating-modal")
      meetingModal.style.width = null;
      meetingModal.style.height= null;
      meetingModal.style.top = null
      meetingModal.style.bottom = '0px'
      meetingModal.style.left = '0px'
      
      meetingIframe.style.width = null
      meetingIframe.style.height = null
      hideDraggableOverlay()
      removeParentResizeListener()
      hideResizeOverlay()
    }
  }

  // Handle Dragging Event 
  let meetingIframeTop = 0
  let meetingIframeLeft = 10
  let pageMouseX, pageMouseY
  let innerWidth = window.innerWidth
  let innerHeight = window.innerHeight

  function showDraggableOverlay() {
    draggableOverlay.style.display = "flex"
    draggableOverlay.addEventListener('touchend', handleDragEnd)
    draggableOverlay.addEventListener('touchmove', handleParentTouchMove)
    draggableOverlay.addEventListener('touchstart', handleParentTouchStart)
  }

  function hideDraggableOverlay() {
    draggableOverlay.style.display = "none"
    draggableOverlay.removeEventListener('touchend', handleDragEnd)
    draggableOverlay.removeEventListener('touchmove', handleParentTouchMove)
    draggableOverlay.removeEventListener('touchstart', handleParentTouchStart)
  }

  function handleStartDrag(mouseX, mouseY) {
    if(!meetingModal) return
    // handle iframe start drag
    meetingIframeTop = meetingModal.offsetTop
    meetingIframeLeft = meetingModal.offsetLeft

    pageMouseX = meetingIframeLeft + mouseX
    pageMouseY = meetingIframeTop + mouseY
  }

  function handleDragEnd() { }

  function handleFrameMousemove(offsetX, offsetY) {
    // Handle drag event from livesell iframe
    if (!pageMouseX || !pageMouseY) return

    meetingIframeTop += offsetY
    meetingIframeLeft += offsetX

    updateMeetingModalPosition(meetingIframeTop, meetingIframeLeft)

    pageMouseX += offsetX
    pageMouseY += offsetY
  }

  function handleParentTouchStart(evt) {
    evt.preventDefault()
    if(!meetingModal) return

    pageMouseX = evt.touches[0].clientX
    pageMouseY = evt.touches[0].clientY

    meetingIframeTop = meetingModal.offsetTop
    meetingIframeLeft = meetingModal.offsetLeft
  }

  function handleParentMouseMove(evt) {
    handleParentDrag(evt)
  }

  function handleParentTouchMove(evt) {
    handleParentDrag(evt.touches[0])
  }

  function handleParentDrag(evt) {
    // Drag the floating Video depending on parent mouse event
    meetingIframeLeft += evt.clientX - pageMouseX
    meetingIframeTop += evt.clientY - pageMouseY
    updateMeetingModalPosition(meetingIframeTop, meetingIframeLeft)
    pageMouseX = evt.clientX
    pageMouseY = evt.clientY
  }

  function updateMeetingModalPosition(top, left) {
    const clampedTop = clampHeight(top);
    const clampedLeft = clampLeft(left);

    meetingIframeTop = clampedTop
    meetingIframeLeft = clampedLeft

    // apply the position
    // calculating bottom position using top 
    meetingModal.style.bottom = ( window.innerHeight - clampedTop - meetingModal.offsetHeight) + 'px'
    meetingModal.style.left = clampedLeft + 'px'
  }

  function clampLeft(value) {
    // avoid dragging div go beyond the screen than half
    return Math.max(Math.min(value, window.innerWidth - meetingModal.offsetWidth / 2), -(meetingModal.offsetWidth / 2));
  }

  function clampHeight(value) {
    // avoid dragging div go beyond the screen than half
    return Math.max(Math.min(value, window.innerHeight - meetingModal.offsetHeight / 2), -(meetingModal.offsetHeight / 2))
  }

  function addParentResizeListener() {
    // Listen for the parent window resize event
    window.addEventListener('resize', handleParentResize);
  }

  function removeParentResizeListener() {
    window.removeEventListener('resize', handleParentResize);
  }

  function handleParentResize(evt) {
    if (!meetingIframeTop || !meetingIframeLeft) return

    // Calculate the updated position based on the existing values
    const resizeTop = (meetingIframeTop * (window.innerHeight - meetingModal.offsetHeight)) / (innerHeight - meetingModal.offsetHeight);
    const resizeLeft = (meetingIframeLeft * (window.innerWidth - meetingModal.offsetWidth)) / (innerWidth - meetingModal.offsetWidth);

    updateMeetingModalPosition(resizeTop, resizeLeft)

    innerHeight = window.innerHeight
    innerWidth = window.innerWidth
  }

  let isResizing = false
  let startX, startY, startWidth, startHeight;

  function handleResizeStart(evt) {
    isResizing = true
    startX = evt.clientX;
    startY = evt.clientY;
    startWidth = meetingModal.offsetWidth;
    startHeight = meetingModal.offsetHeight;
    transparentOverlay.style.display = "flex"

    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeStop);

    resizeOverlay.addEventListener('touchmove', handleResizeTouchMove)
    resizeOverlay.addEventListener('touchend', handleResizeStop)
  }

  function handleResizeMove(evt) {
    var ratio = 16 / 9;
    const width = startWidth + evt.clientX - startX
    const height = (width / ratio)

    if(canResize(width, height)) return

    meetingModal.style.width = width + 'px';
    meetingModal.style.height = height + 'px';
  }

  function canResize(width, height) {
    return (width < floatingWindowSize.minWidth
      || height < floatingWindowSize.minHeight
      || width > floatingWindowSize.maxWidth
      || height > floatingWindowSize.maxHeight
      || width > window.innerWidth
      || height > window.innerHeight)
  }

  function handleResizeMouseMove(evt) {
    evt.preventDefault()
    handleResizeMove(evt)
  }

  function handleResizeTouchMove(evt) {
    evt.preventDefault()
    handleResizeMove(evt.touches[0])
  }

  function handleResizeStop(evt) {
    isResizing = false
    transparentOverlay.style.display = "none"
    document.removeEventListener("mouseup", handleResizeStop)
    document.removeEventListener("mousemove", handleResizeMouseMove)

    resizeOverlay.addEventListener('touchend', handleResizeStop)
    resizeOverlay.removeEventListener('touchmove', handleResizeTouchMove)
  }

  function handleResizeTouchStart(evt) {
    evt.preventDefault()
    handleResizeStart(evt.touches[0])
  }

  function handleResizeMouseStart(evt) {
    evt.preventDefault()
    handleResizeStart(evt)
  }

  function showResizeOverlay() {
    resizeOverlay.style.display = "flex"
    resizeOverlay.addEventListener("mousedown", handleResizeMouseStart)
    resizeOverlay.addEventListener('touchstart', handleResizeTouchStart)
  }

  function hideResizeOverlay() {
    resizeOverlay.style.display = "none"
    resizeOverlay.removeEventListener("mousedown", handleResizeMouseStart)
    resizeOverlay.removeEventListener('touchstart', handleResizeTouchStart)
  }

})()

