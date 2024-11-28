package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Incident;
import com.limayrac.velopoubelle.service.IncidentService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<Incident>> getActiveIncidents() {
        List<Incident> activeIncidents = incidentService.getActiveIncidents();
        return ResponseEntity.ok(activeIncidents);
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents() {
        List<Incident> incidents = incidentService.findAll();
        return ResponseEntity.ok().body(incidents);
    }

    @PostMapping
    public Incident addIncident(@RequestBody Incident incident) {
        return incidentService.addIncident(incident);
    }

    @PutMapping("/{id}/resolve")
    public Incident resolveIncident(@PathVariable Long id) {
        return incidentService.resolveIncident(id);
    }
}
