package com.limayrac.velopoubelle.web.rest;

import com.limayrac.velopoubelle.domain.Incident;
import com.limayrac.velopoubelle.service.IncidentService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public List<Incident> getActiveIncidents() {
        return incidentService.getActiveIncidents();
    }

    @PostMapping
    public Incident addIncident(@RequestBody Incident incident) {
        return incidentService.addIncident(incident);
    }

    @PatchMapping("/{id}/resolve")
    public Incident resolveIncident(@PathVariable Long id) {
        return incidentService.resolveIncident(id);
    }
}
