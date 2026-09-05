import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Renders each garden zone as a 3D plot in a grid, color-coded by moisture
 * level (red = dry, yellow = moderate, green = well-watered). Zones with
 * moisture below the watering threshold get a simple animated "sprinkler"
 * cue (a rising blue pillar) to visualize irrigation being triggered.
 *
 * Supports orbit/zoom via mouse or touch, and shows a hover tooltip with
 * the exact moisture percentage for the plot under the cursor.
 *
 * This is a visual/logical model of the system, not a physically accurate
 * soil simulation — it exists to make the dashboard's data legible at a
 * glance and to demo the concept.
 */
export default function GardenScene3D({ zones, readingsByZone }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const readingsRef = useRef(readingsByZone);
  readingsRef.current = readingsByZone;

  const [tooltip, setTooltip] = useState(null); // { x, y, zoneName, moisture }

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(4, 5, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.1; // don't let the camera go below the ground

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(5, 10, 5);
    scene.add(ambient, directional);

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xdcd3c0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    stateRef.current.plots = {};
    stateRef.current.sprinklers = {};

    zones.forEach((zone) => {
      const plotGeo = new THREE.BoxGeometry(1.6, 0.3, 1.6);
      const plotMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
      const plot = new THREE.Mesh(plotGeo, plotMat);
      plot.position.set(zone.grid_x * 2, 0.15, zone.grid_y * 2);
      plot.userData.zoneId = zone.id;
      plot.userData.zoneName = zone.name;
      scene.add(plot);
      stateRef.current.plots[zone.id] = plot;

      // Sprinkler indicator (hidden by default, shown when watering)
      const sprinklerGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
      const sprinklerMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
      const sprinkler = new THREE.Mesh(sprinklerGeo, sprinklerMat);
      sprinkler.position.set(zone.grid_x * 2, 0.8, zone.grid_y * 2);
      sprinkler.visible = false;
      scene.add(sprinkler);
      stateRef.current.sprinklers[zone.id] = sprinkler;
    });

    // Center camera + orbit target roughly over the grid
    const avgX = zones.reduce((s, z) => s + z.grid_x, 0) / (zones.length || 1);
    const avgZ = zones.reduce((s, z) => s + z.grid_y, 0) / (zones.length || 1);
    camera.position.set(avgX * 2 + 4, 5, avgZ * 2 + 6);
    controls.target.set(avgX * 2, 0, avgZ * 2);
    controls.update();

    // Raycasting for hover tooltips
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function handlePointerMove(event) {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const plotMeshes = Object.values(stateRef.current.plots);
      const hits = raycaster.intersectObjects(plotMeshes);

      if (hits.length > 0) {
        const hit = hits[0].object;
        const reading = readingsRef.current[hit.userData.zoneId];
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          zoneName: hit.userData.zoneName,
          moisture: reading ? reading.moisture_percent : null,
        });
      } else {
        setTooltip(null);
      }
    }

    function handlePointerLeave() {
      setTooltip(null);
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    let frameId;
    function animate() {
      frameId = requestAnimationFrame(animate);
      controls.update();

      // Update plot colors and sprinkler visibility from latest readings
      zones.forEach((zone) => {
        const plot = stateRef.current.plots[zone.id];
        const sprinkler = stateRef.current.sprinklers[zone.id];
        const reading = readingsRef.current[zone.id];
        if (!plot || !reading) return;

        const moisture = reading.moisture_percent;
        let color;
        if (moisture < 30) color = 0xb45309; // dry - brownish red
        else if (moisture < 60) color = 0xca8a04; // moderate - amber
        else color = 0x16a34a; // wet - green
        plot.material.color.setHex(color);

        sprinkler.visible = moisture < 30;
        if (sprinkler.visible) {
          sprinkler.scale.y = 1 + Math.sin(Date.now() / 200) * 0.15;
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      controls.dispose();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  return (
    <div ref={mountRef} className="relative w-full h-full rounded-lg overflow-hidden border">
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border rounded shadow px-2 py-1 text-xs"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <p className="font-medium">{tooltip.zoneName}</p>
          <p>{tooltip.moisture !== null ? `${tooltip.moisture}%` : 'No reading yet'}</p>
        </div>
      )}
    </div>
  );
}
