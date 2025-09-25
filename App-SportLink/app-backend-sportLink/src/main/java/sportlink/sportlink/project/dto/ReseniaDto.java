package sportlink.sportlink.project.dto;


import sportlink.sportlink.project.entidades.Cliente;
import sportlink.sportlink.project.entidades.Entrenador;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReseniaDto implements Serializable {

    private Integer idResenia;
    private Integer calificacion;
    private String comentario;
    private Cliente cliente;
    private Entrenador entrenador;
}
