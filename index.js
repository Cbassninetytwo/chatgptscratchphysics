(function(Scratch) {
  "use strict";

  // Check if the MouseCursor extension is being run unsandboxed
  if (!Scratch.extensions.unsandboxed) {
    throw new Error("MouseCursor extension must be run unsandboxed");
  }

  // Create a lazily instantiated canvas and context for encoding skins as data URIs
  const createCanvasAndContext = () => {
    let canvas = null;
    let context = null;

    return (width, height) => {
      if (!canvas) {
        canvas = document.createElement("canvas");
        context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not get 2d rendering context");
        }
      }

      // Setting the canvas width and height clears it
      canvas.width = width;
      canvas.height = height;

      return [canvas, context];
    };
  };

  const getRawSkinCanvas = createCanvasAndContext();

  // Encode skins as data URIs
  const encodeSkinToDataURL = (skin) => {
    const svgSkin = skin instanceof RenderWebGL.SVGSkin ? skin : null;

    if (svgSkin && svgSkin._svgImage) {
      // This is an SVG skin, so just return its existing data URI
      return svgSkin._svgImage.src;
    }

    // It's probably a bitmap skin.
    // The most reliable way to get the bitmap in every runtime is through the silhouette.
    // This is very slow and could involve reading the texture from the GPU.
    const silhouette = skin._silhouette;
    // unlazy() only exists in TW
    if (silhouette.unlazy) {
      silhouette.unlazy();
    }
    const colorData = silhouette._colorData;
    const width = silhouette._width;
    const height = silhouette._height;
    const imageData = new ImageData(colorData, silhouette._width, silhouette._height);

    const [canvas, context] = getRawSkinCanvas(width, height);
    context.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  };

  // Convert a costume to a cursor image with a maximum size
  const costumeToCursor = (costume, maxWidth, maxHeight) => {
    const skin = Scratch.vm.renderer._allSkins[costume.skinId];
    const imageURI = encodeSkinToDataURL(skin);

    let width = skin.size[0];
    let height = skin.size[1];

    // Scale the image down if its width or height exceeds the maximum size
    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (maxHeight / height) * width;
      height = maxHeight;
    }

    width = Math.round(width);
    height = Math.round(height);

    // We wrap the encoded image in an <svg> to resize the image without a canvas.
    // The browser can handle images with more raw pixels than their DPI-independent size,
    // which prevents cursors from looking horrible on high DPI displays.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><image href="${imageURI}" width="${width}" height="${height}" /></svg>`;
    const svgURI = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    return {
      uri: svgURI,
      width,
      height
    };
  };

  // Set up default cursor and canvas cursor
  let nativeCursor = "default";
  let currentCursor
