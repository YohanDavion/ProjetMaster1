package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Incident;
import com.limayrac.velopoubelle.repository.IncidentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;

    public IncidentService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    public List<Incident> getActiveIncidents() {
        return incidentRepository.findByBlockedTrue();
    }

    public Incident addIncident(Incident incident) {
        return incidentRepository.save(incident);
    }

    public Incident resolveIncident(Long id) {
        Incident incident = incidentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Incident introuvable"));
        incident.setBlocked(false);
        incident.setResolvedAt(LocalDateTime.now());
        return incidentRepository.save(incident);
    }
}
