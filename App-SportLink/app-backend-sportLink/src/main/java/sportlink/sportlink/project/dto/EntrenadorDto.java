package sportlink.sportlink.project.dto;

import sportlink.sportlink.project.entidades.Resenia;
import sportlink.sportlink.project.entidades.Servicio;
import sportlink.sportlink.project.entidades.Sesion;
import lombok.*;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EntrenadorDto implements Serializable {

    private Integer idEntrenador;
    private String nombre;
    private String correo;
    private String contrasenia;
    private ArrayList<String> especialidad;
    private ArrayList<String> certificaciones;
    private String fotoPerfil;
    private List<Resenia> resenias;
    private List<Sesion> sesiones;
    private List<Servicio> servicios;
}
