package com.limayrac.velopoubelle.domain;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
public class Arret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;

    // Assuming you have a custom type or use a geometry library for the position
    private String position;

    @ManyToMany(mappedBy = "arrets")
    private Set<Rue> rues = new HashSet<>();

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public Set<Rue> getRues() {
        return rues;
    }

    public void setRues(Set<Rue> rues) {
        this.rues = rues;
    }
}
