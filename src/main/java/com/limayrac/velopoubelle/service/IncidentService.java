package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Incident;
import com.limayrac.velopoubelle.repository.IncidentRepository;
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

    public List<Incident> findAll() {
        return incidentRepository.findAll();
    }

    public Incident addIncident(Incident incident) {
        incident.setCreatedAt(String.valueOf(System.currentTimeMillis()));
        incident.setResolvedAt(null); // S'assurer qu'il n'est pas marqué comme résolu
        incident.setBlocked(true); // L'incident est actif par défaut
        return incidentRepository.save(incident);
    }

    public Incident resolveIncident(Long id) {
        Incident incident = incidentRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Incident introuvable"));
        incident.setBlocked(false);
        incident.setResolvedAt(String.valueOf(System.currentTimeMillis()));
        return incidentRepository.save(incident);
    }
}
