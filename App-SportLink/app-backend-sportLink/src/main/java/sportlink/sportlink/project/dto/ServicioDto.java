package sportlink.sportlink.project.dto;

import sportlink.sportlink.project.entidades.Entrenador;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicioDto implements Serializable {

    private Integer idServicio;
    private String nombre;
    private String descripcion;
    private Float precio;
    private String ubicacion;
    private Entrenador entrenador;

}
