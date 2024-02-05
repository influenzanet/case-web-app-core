import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ImageBrowserViewModel } from "./models/ImageBrowserViewModel";
import { ImageBrowserDataReader } from "./services/ImageBrowserDataReader";

import "./ImageBrowser.scss";

import { format as formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { LoadingPlaceholder } from "@influenzanet/case-web-ui";

import { ArrowLeftCircle, ArrowRightCircle } from "react-bootstrap-icons";

export interface ImageBrowserProps {
  className?: string;
  enableAnimations?: boolean;
  dataReader: ImageBrowserDataReader;
  dateLocales?: Array<{ code: string; locale: any; format: string }>;
  translationNamespace?: string;
}

const ImageBrowser: React.FC<ImageBrowserProps> = (props) => {
  const { t, i18n } = useTranslation([
    `${props.translationNamespace ?? "imageBrowser"}`,
  ]);

  const [index, setIndex] = useState(0);
  const [imgIndex, setImgIndex] = useState(index);

  const [images, setImages] = useState(new Array<ImageBrowserViewModel>());
  const [isLoading, setIsLoading] = useState(false);

  const transitionDivRef = useRef<HTMLDivElement>(null);

  const shiftIndexes = function (delta: number) {
    const newIndex = index + delta;

    if (props.enableAnimations) setImgIndex(index);
    else setImgIndex(newIndex);

    setIndex(newIndex);
  };

  const prev = function () {
    shiftIndexes(-1);
    return true;
  };

  const next = function () {
    shiftIndexes(1);
    return true;
  };

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout>;

    if (index < images.length - 2) return;

    async function retrieveData() {
      timer = setTimeout(() => {
        if (isMounted) {
          setIsLoading(true);
        }
      }, 300);

      try {
        const data = await props.dataReader.next(5);

        clearTimeout(timer);

        if (isMounted && data.length > 0) {
          setImages(images.concat(data));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    retrieveData();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [props.dataReader, index, images]);

  /* NOTE: this effect runs each time a render is triggered by a change of
   * index, before the browser repaints the screen.
   *
   * When entering this effect, a transition class will be added to the
   * transition div, eventually resetting and re-triggering the associated
   * animation.
   */
  useLayoutEffect(() => {
    if (!transitionDivRef.current) return;

    transitionDivRef.current.className = "";

    let transitionClass = "transition-none";
    if (index < imgIndex) transitionClass = "transition-right";
    else if (index > imgIndex) transitionClass = "transition-left";

    // NOTE: this resets the CSS animation, see:
    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Tips#run_an_animation_again
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        transitionDivRef.current?.classList.add(transitionClass);
        return true;
      });
      return true;
    });
  }, [index, imgIndex]);

  /* NOTE: the placement of the images inside this component always reflects the
   * configuration associated to the previous value of the index variable.
   *
   * If the previous index value was different from the current one, the right
   * animation will be triggered by the associated useLayoutEffect(),
   * transitioning the images into a configuration reflecting the actual index
   * value.
   *
   * If the previous index value did equal the current one, the render of the
   * component will place the images in a configuration already reflecting the
   * actual index value and no transition will be triggered.
   */
  return (
    <div
      className={`symptoms-history ${props.className} d-flex flex-column flex-grow-1 align-items-center p-2`}
    >
      {isLoading ? (
        <LoadingPlaceholder color="white" minHeight={150} />
      ) : images.length === 0 ? (
        <>
          <p className="no-data">{t("noData")}</p>
        </>
      ) : (
        <>
          <h5 className="fw-bold">
            {formatDate(new Date(images[index].date * 1000), "Pp", {
              locale: props.dateLocales?.find((dl) => dl.code === i18n.language)
                ?.locale,
            })}
          </h5>
          <div ref={transitionDivRef} id="transition-div">
            <div className="d-flex align-items-center">
              <div id="left_arrow" className="d-sm-none">
                <ArrowLeftCircle />
              </div>
              <div className="image-slot d-flex align-items-center justify-content-center position-relative">
                <div className="image-slot-small position-relative">
                  {imgIndex > 0 && (
                    <img
                      src={images[imgIndex - 1]?.imageUrl}
                      className="img-thumbnail"
                      id="prev-week"
                    ></img>
                  )}
                  {imgIndex > 1 && (
                    <img
                      src={images[imgIndex - 2]?.imageUrl}
                      className="img-thumbnail"
                      id="new-prev-week"
                    ></img>
                  )}
                  {index > 0 && <div className="click-layer" onClick={prev} />}
                </div>
              </div>
              <div className="image-slot">
                <div className="position-relative">
                  <img
                    src={images[imgIndex]?.imageUrl}
                    className="img-thumbnail"
                    id="current-week"
                  ></img>
                  <div className="click-layer"></div>
                </div>
              </div>
              <div className=" image-slot d-flex align-items-center justify-content-center position-relative">
                <div className="image-slot-small position-relative">
                  {images.length - imgIndex > 1 && (
                    <img
                      src={images[imgIndex + 1]?.imageUrl}
                      className="img-thumbnail"
                      id="next-week"
                    ></img>
                  )}
                  {images.length - imgIndex > 2 && (
                    <img
                      src={images[imgIndex + 2]?.imageUrl}
                      className="img-thumbnail"
                      id="new-next-week"
                    ></img>
                  )}
                  {images.length - index > 1 && (
                    <div className="click-layer" onClick={next}></div>
                  )}
                </div>
              </div>
              <div id="right_arrow" className="d-sm-none">
                <ArrowRightCircle />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

ImageBrowser.defaultProps = {
  className: "col-lg-8 text-white bg-primary",
  enableAnimations: true,
};

export default ImageBrowser;
