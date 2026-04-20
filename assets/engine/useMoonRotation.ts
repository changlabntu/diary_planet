import { useCallback, useEffect, useRef, useState } from 'react';
import { IDENTITY, applyDragRotation, type Mat3 } from './rotationMatrix';
import { projectCraters, type ProjectedCrater } from './craters';

export interface UseMoonRotationOptions {
  centerX: number;
  centerY: number;
  moonRadius: number;
  dragSensitivity?: number;
  inertiaDecay?: number;
  initialVelocityX?: number;
}

export function useMoonRotation({
  centerX,
  centerY,
  moonRadius,
  dragSensitivity = 0.008,
  inertiaDecay = 0.96,
  initialVelocityX = 0.005,
}: UseMoonRotationOptions) {
  const matrixRef = useRef<Mat3>(IDENTITY);
  const velocityRef = useRef({ x: initialVelocityX, y: 0 });
  const isDraggingRef = useRef(false);

  const [craters, setCraters] = useState<ProjectedCrater[]>(() =>
    projectCraters(matrixRef.current, centerX, centerY, moonRadius),
  );

  const reproject = useCallback(() => {
    setCraters(projectCraters(matrixRef.current, centerX, centerY, moonRadius));
  }, [centerX, centerY, moonRadius]);

  const onDragStart = useCallback(() => {
    isDraggingRef.current = true;
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  const onDragMove = useCallback(
    (dx: number, dy: number) => {
      matrixRef.current = applyDragRotation(
        matrixRef.current,
        dx,
        dy,
        dragSensitivity,
      );
      velocityRef.current = { x: dx, y: dy };
      reproject();
    },
    [dragSensitivity, reproject],
  );

  const onDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    let rafId: number;

    const tick = () => {
      if (!isDraggingRef.current) {
        const vel = velocityRef.current;
        if (Math.abs(vel.x) > 0.0001 || Math.abs(vel.y) > 0.0001) {
          matrixRef.current = applyDragRotation(
            matrixRef.current,
            vel.x,
            vel.y,
            dragSensitivity,
          );
          velocityRef.current = {
            x: vel.x * inertiaDecay,
            y: vel.y * inertiaDecay,
          };
          reproject();
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [dragSensitivity, inertiaDecay, reproject]);

  return { craters, onDragStart, onDragMove, onDragEnd };
}
