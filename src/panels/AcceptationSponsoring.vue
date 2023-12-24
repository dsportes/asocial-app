<template>
<q-dialog v-model="ui.d.ASaccsp" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NPtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-sm">
      <div :class="'titre-md text-' + clr(sp)">{{$t('NPst' + sp.st, [dhcool(sp.dh)])}}</div>
      <div class="titre-md">{{$t('NPphr')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{pc.phrase}}</span>
      </div>
      <div class="titre-md">{{$t('NPdlv')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{dlved(sp)}}</span>
      </div>
      <div class="titre-md">{{$t('NPnom')}}
        <span class="text-bold font-mono q-px-md">{{sp.naf.nom}}</span>
      </div>
      <div class="q-mt-md titre-md">{{$t('NPsponsor')}}</div>
      <div class="row items-start">
        <img class="photomax col-auto q-mr-sm" :src="photoP" />
        <div class="col column">
          <div>
            <span class="text-bold fs-md q-mr-sm">{{sp.na.nom}}</span> 
            <span class="text-bold fs-sm font-mono q-mr-sm">#{{sp.na.id}}</span> 
          </div>
          <show-html v-if="sp.na.info" class="q-my-xs border1" zoom maxh="4rem" :texte="infoP"/>
          <div v-else class="text-italic">{{$t('FAnocv')}}</div>
        </div>
      </div>

      <div v-if="estA" class="text-warning titre-md">{{$t('compteA')}}</div>
      <div v-else class="titre-md">{{$t('compteO')}}</div>

      <div v-if="sp.sp" class="titre-md text-warning">
        {{$t('NPspons' + (estA ? 'A' : ''), [ID.court(idtr)])}}
      </div>

      <div class="titre-md">{{$t('NPquo')}}</div>
      <quotas-vols class="q-ml-md" :vols="quotas" noutil/>

      <div class="titre-md q-mt-xs">{{$t('NPmot')}}</div>
      <show-html class="q-mb-xs border1" zoom maxh="4rem" :texte="sp.ard"/>

      <q-separator color="orange" class="q-my-md"/>
      <div class="q-gutter-md row justify-center full-width">
        <q-radio dense v-model="accdec" color="primay" class="text-primary"
          :val="1" :label="$t('NPacc')" />
        <q-radio dense v-model="accdec" color="warning" class="text-warning"
          :val="2" :label="$t('NPdec')" />
      </div>
      <q-separator color="orange" class="q-my-md"/>

      <div v-if="accdec===1 && ps">
        <div class="titre-md q-mt-sm">{{$t('NPmota')}}</div>
        <editeur-md mh="10rem" v-model="texte" :texte="textedef" 
          editable modetxt hors-session/>
        <q-btn flat @click="fermer" color="primary" :label="$t('renoncer')" class="q-ml-sm" />
        <q-btn flat @click="confirmer" :disable="texte.length === 0"
          color="warning" :label="$t('APAconf')" class="q-ml-sm" />
      </div>

      <div v-if="accdec===2">
        <div class="titre-md q-mt-sm">{{$t('NPmotd')}}</div>
        <editeur-md mh="10rem" v-model="texte" :texte="textedef"
          editable modetxt hors-session/>
        <q-btn flat @click="fermer" color="primary" padding="xs" dense size="md"
          :label="$t('renoncer')" class="q-ml-sm" />
        <q-btn flat @click="refuser" color="warning" padding="xs" dense size="md"
          :disable="texte.length === 0"
          :label="$t('APAdec2')" class="q-ml-sm" />
      </div>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import { AcceptationSponsoring, RefusSponsoring } from '../app/connexion.mjs'
import { ExistePhrase } from '../app/operations.mjs'
import QuotasVols from '../components/QuotasVols.vue'
import { styp, dhcool } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { crypter } from '../app/webcrypto.mjs'
import { Tribu } from '../app/modele.mjs'

export default ({
  name: 'AcceptationSponsoring',

  props: { sp: Object, pc: Object },
  /*
  pc : objet Phrase
  sp : objet Sponsoring décodé
    - id
    - org
    - ids
    - `ard`: ardoise.
    - 'dlv': 
    - `na` : du sponsor P.
    - `cv` : du sponsor P.
    - `naf` : na attribué au filleul.
    - `clet` : clé de sa tribu.
    - 'cletX' : clé de sa tribu cryptée par la clé K du comptable
    - 'quotas' : [qc, q1, q2]
    - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
    - 'idcsp': id du COMPTE de l'avatar sponsor
- `quotas` : `[v1, v2]` quotas attribués par le parrain.
  */

  components: { EditeurMd, ShowHtml, BoutonHelp, QuotasVols },

  computed: {
    estA () { return !this.sp.clet },
    quotas () { const q = this.sp.quotas; return { qc: q[0], q1: q[1], q2: q[2]}},
    photoP () { return this.sp.cv && this.sp.cv.photo ? this.sp.cv.photo : this.sp.na.defIcon },
    infoP () { return this.sp.cv && this.sp.cv.info ? this.sp.cv.info : '' },
    estpar () { return this.sp.sp },
    textedef () { return this.$t('merci', [this.sp.na.nom]) },
    valid () { return this.sp.dlv},
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    idtr () { return Tribu.id(this.sp.clet) },
  },

  data () {
    return {
      accdec: 0,
      isPwd: false,
      jourJ: AMJ.amjUtc(),
      max: [1, 1],
      ps: null,
      apsf: false,
      texte: '',
      npi: false,
      dhcool: dhcool
    }
  },

  watch: {
    accdec (ap, av) {
      if (ap === 1 && !this.ps) {
        this.ui.ps = {
          labelValider: 'ok',
          verif: true,
          orgext: this.sp.org,
          ok: this.okps,
          initVal: this.ps ? this.ps.phrase : ''
        }
        this.ui.oD('PSouvrir')
      }
    }
  },

  methods: {
    dlved (sp) { return AMJ.editDeAmj(sp.dlv) },
    clr (sp) { return ['primary', 'warning', 'green-5', 'negative'][sp.st] },
    fermer () {
      this.texte = ''
      this.apsf = false
      this.isPwd = false
      this.ps = null
      this.ui.fD()
    },
    async okps (ps) {
      if (ps) {
        if (await new ExistePhrase().run(ps.hps1, 1)) {
          await afficherDiag(this.$t('existe'))
          return
        }
        this.ps = ps
      } else {
        this.accdec = 0
      }
    },
    async confirmer () {
      const ardx = await crypter(this.pc.clex, this.texte)
      await new AcceptationSponsoring().run(this.sp, ardx, this.texte, this.sp.ard, this.ps)
      this.fermer()
    },
    async refuser () {
      const ardx = await crypter(this.pc.clex, this.texte)
      await new RefusSponsoring().run(this.sp, ardx)
      this.fermer()
    }
  },

  setup (props) {
    const ui = stores.ui
    // const sp = toRef(props, 'sp')
    // const pc = toRef(props, 'pc')
    return {
      ui, ID, styp
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.border1
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
</style>
